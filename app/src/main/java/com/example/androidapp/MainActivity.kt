package com.example.androidapp  // ← ваш package

import android.Manifest
import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var currentPhotoFile: File? = null
    private val MAX_IMAGE_SIZE = 1280
    private val JPEG_QUALITY = 85

    // Для отслеживания завершения скачиваний
    private var lastDownloadId: Long = -1
    private var downloadReceiver: BroadcastReceiver? = null

    // Последний скачанный документ
    private var lastDownloadedUri: String? = null
    private var lastDownloadedName: String? = null
    private var lastDownloadedMime: String = "application/octet-stream"

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = filePathCallback ?: return@registerForActivityResult

        val uris: Array<Uri>? = when {
            result.resultCode != RESULT_OK -> null
            currentPhotoFile != null -> {
                val compressed = compressAndSave(currentPhotoFile!!)
                currentPhotoFile = null
                if (compressed != null) {
                    arrayOf(FileProvider.getUriForFile(
                        this, "${packageName}.fileprovider", compressed))
                } else null
            }
            result.data?.clipData != null -> {
                val count = result.data!!.clipData!!.itemCount
                Array(count) { i -> result.data!!.clipData!!.getItemAt(i).uri }
            }
            result.data?.data != null -> arrayOf(result.data!!.data!!)
            else -> null
        }
        callback.onReceiveValue(uris)
        filePathCallback = null
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Запрашиваем только реально нужные разрешения
        val needed = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.CAMERA)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.ACCESS_FINE_LOCATION)
            needed.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }

        // ==============================================================
        // Слушаем завершение скачиваний — сразу открываем документ
        // ==============================================================
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        downloadReceiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                val id = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) ?: -1L
                if (id != lastDownloadId) return

                try {
                    val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                    val query = DownloadManager.Query().setFilterById(id)
                    val cursor = dm.query(query)

                    if (cursor != null && cursor.moveToFirst()) {
                        val statusCol = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                        val titleCol = cursor.getColumnIndex(DownloadManager.COLUMN_TITLE)
                        val reasonCol = cursor.getColumnIndex(DownloadManager.COLUMN_REASON)

                        val status = if (statusCol >= 0) cursor.getInt(statusCol) else -1
                        val fileName = if (titleCol >= 0) cursor.getString(titleCol) else "файл"
                        val reason = if (reasonCol >= 0) cursor.getInt(reasonCol) else -1
                        cursor.close()

                        when (status) {
                            DownloadManager.STATUS_SUCCESSFUL -> {
                                android.util.Log.d("JIXOZMED", "✅ Скачано: $fileName")

                                val contentUri = dm.getUriForDownloadedFile(id)
                                if (contentUri != null) {
                                    val mime = mimeForFileName(fileName, "application/octet-stream")
                                    lastDownloadedUri = contentUri.toString()
                                    lastDownloadedName = fileName
                                    lastDownloadedMime = mime

                                    // Открываем сразу — без уведомлений
                                    openDocument(contentUri, mime)
                                } else {
                                    Toast.makeText(
                                        applicationContext,
                                        "✅ Скачано: $fileName",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                            }
                            DownloadManager.STATUS_FAILED -> {
                                android.util.Log.e("JIXOZMED",
                                    "❌ Скачивание не удалось, reason=$reason")
                                Toast.makeText(
                                    applicationContext,
                                    "❌ Не удалось скачать файл (код $reason)",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("JIXOZMED",
                        "❌ Ошибка в downloadReceiver: ${e.message}")
                }
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(downloadReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(downloadReceiver, filter)
        }

        setContent { LocalWebViewScreen() }
    }

    override fun onDestroy() {
        super.onDestroy()
        downloadReceiver?.let {
            try { unregisterReceiver(it) } catch (_: Exception) { }
            downloadReceiver = null
        }
    }

    // ==========================================================
    // ОТКРЫТИЕ ДОКУМЕНТА
    // ==========================================================
    private fun openDocument(uri: Uri, mime: String) {
        try {
            val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mime)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(viewIntent)
            android.util.Log.d("JIXOZMED", "📂 Открываю: $uri  ($mime)")
        } catch (e: Exception) {
            android.util.Log.e("JIXOZMED", "❌ Не могу открыть: ${e.message}")
            runOnUiThread {
                Toast.makeText(
                    this,
                    "Не найдено приложение для открытия файла. Установите Word или WPS.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    // ==========================================================
    // MIME-тип по расширению файла
    // ==========================================================
    private fun mimeForFileName(name: String, fallback: String): String {
        val lower = name.lowercase()
        return when {
            lower.endsWith(".docx") -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            lower.endsWith(".doc")  -> "application/msword"
            lower.endsWith(".pdf")  -> "application/pdf"
            lower.endsWith(".xlsx") -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            lower.endsWith(".xls")  -> "application/vnd.ms-excel"
            else -> fallback
        }
    }

    // ==========================================================
    // JS-МОСТ: открыть последний скачанный документ
    // ==========================================================

    @JavascriptInterface
    fun downloadFile(url: String, fileName: String) {
        try {
            android.util.Log.d("JIXOZMED", "⬇️ downloadFile: $url  →  $fileName")

            val request = DownloadManager.Request(Uri.parse(url))
            request.setMimeType(mimeForFileName(fileName, "application/octet-stream"))

            CookieManager.getInstance().getCookie(url)?.let {
                request.addRequestHeader("cookie", it)
            }

            request.setTitle(fileName)
            request.setDescription("Скачивание документа…")
            request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_ONLY_COMPLETION
            )
            request.setDestinationInExternalPublicDir(
                Environment.DIRECTORY_DOWNLOADS, fileName
            )

            val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
            lastDownloadId = dm.enqueue(request)

            android.util.Log.d("JIXOZMED", "📥 enqueued: id=$lastDownloadId  file=$fileName")

            runOnUiThread {
                Toast.makeText(
                    applicationContext,
                    "Скачивание: $fileName",
                    Toast.LENGTH_SHORT
                ).show()
            }
        } catch (e: Exception) {
            android.util.Log.e("JIXOZMED", "❌ downloadFile: ${e.message}")
            runOnUiThread {
                Toast.makeText(
                    applicationContext,
                    "Ошибка: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    @JavascriptInterface
    fun saveBase64File(base64: String, fileName: String) {
        try {
            android.util.Log.d("JIXOZMED",
                "💾 saveBase64File: $fileName (${base64.length} b64 chars)")

            val bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT)
            val mime = mimeForFileName(fileName, "application/octet-stream")

            val savedUri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ — через MediaStore, без разрешений на хранилище
                val values = android.content.ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mime)
                    put(MediaStore.MediaColumns.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS)
                }
                val uri = contentResolver.insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI, values
                ) ?: throw IllegalStateException("MediaStore insert вернул null")

                contentResolver.openOutputStream(uri)?.use { it.write(bytes) }
                    ?: throw IllegalStateException("openOutputStream вернул null")
                uri
            } else {
                // Android 9 и ниже — прямая запись в Downloads
                val dir = Environment.getExternalStoragePublicDirectory(
                    Environment.DIRECTORY_DOWNLOADS
                )
                if (!dir.exists()) dir.mkdirs()
                val file = File(dir, fileName)
                FileOutputStream(file).use { it.write(bytes) }
                Uri.fromFile(file)
            }

            android.util.Log.d("JIXOZMED", "✅ Сохранено: $savedUri")

            lastDownloadedUri  = savedUri.toString()
            lastDownloadedName = fileName
            lastDownloadedMime = mime

            runOnUiThread {
                Toast.makeText(applicationContext,
                    "✅ Сохранено: $fileName", Toast.LENGTH_SHORT).show()
                openDocument(savedUri, mime)
            }
        } catch (e: Exception) {
            android.util.Log.e("JIXOZMED", "❌ saveBase64File: ${e.message}", e)
            runOnUiThread {
                Toast.makeText(applicationContext,
                    "Ошибка сохранения: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }


    @JavascriptInterface
    fun openLastDownloaded() {
        val uriStr = lastDownloadedUri
        val mime = lastDownloadedMime
        if (uriStr.isNullOrBlank()) {
            runOnUiThread {
                Toast.makeText(this, "Нет скачанных документов", Toast.LENGTH_SHORT).show()
            }
            return
        }
        runOnUiThread {
            openDocument(Uri.parse(uriStr), mime)
        }
    }

    @JavascriptInterface
    fun hasLastDownloaded(): Boolean = !lastDownloadedUri.isNullOrBlank()

    @JavascriptInterface
    fun shareFile(base64Data: String, filename: String, title: String) {
        try {
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            val file = File(cacheDir, filename)
            val fos = FileOutputStream(file)
            fos.write(bytes)
            fos.close()

            val uri = FileProvider.getUriForFile(
                this,
                "${packageName}.fileprovider",
                file
            )

            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/vnd.ms-excel"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(intent, title)
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            runOnUiThread {
                startActivity(chooser)
            }
        } catch (e: Exception) {
            Log.e("JIXOZMED", "❌ shareFile: ${e.message}", e)
            runOnUiThread {
                Toast.makeText(applicationContext, "Ошибка отправки файла: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    // ==========================================================
    // СЖАТИЕ ФОТО + ИСПРАВЛЕНИЕ ОРИЕНТАЦИИ
    // ==========================================================
    private fun compressAndSave(source: File): File? {
        return try {
            val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(source.absolutePath, opts)

            var sampleSize = 1
            while (opts.outWidth / sampleSize > MAX_IMAGE_SIZE * 2 ||
                opts.outHeight / sampleSize > MAX_IMAGE_SIZE * 2) {
                sampleSize *= 2
            }

            val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sampleSize }
            var bitmap = BitmapFactory.decodeFile(source.absolutePath, decodeOpts)
                ?: return null

            bitmap = fixOrientation(source.absolutePath, bitmap)

            val w = bitmap.width
            val h = bitmap.height
            val maxSide = maxOf(w, h)
            if (maxSide > MAX_IMAGE_SIZE) {
                val scale = MAX_IMAGE_SIZE.toFloat() / maxSide
                bitmap = Bitmap.createScaledBitmap(bitmap,
                    (w * scale).toInt(), (h * scale).toInt(), true)
            }

            val out = File(cacheDir, "compressed_${System.currentTimeMillis()}.jpg")
            FileOutputStream(out).use {
                bitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, it)
            }
            bitmap.recycle()
            source.delete()
            out
        } catch (e: Exception) {
            android.util.Log.e("JIXOZMED", "Ошибка compressAndSave: ${e.message}")
            null
        }
    }

    // ==========================================================
    // ИСПРАВЛЕНИЕ ОРИЕНТАЦИИ
    // ==========================================================
    private fun fixOrientation(path: String, bitmap: Bitmap): Bitmap {
        return try {
            val exif = ExifInterface(path)
            val orientation = exif.getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL
            )

            val matrix = Matrix()

            when (orientation) {
                ExifInterface.ORIENTATION_ROTATE_90  -> matrix.postRotate(90f)
                ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
                ExifInterface.ORIENTATION_FLIP_VERTICAL   -> matrix.postScale(1f, -1f)
                ExifInterface.ORIENTATION_TRANSPOSE -> {
                    matrix.postRotate(90f); matrix.postScale(-1f, 1f)
                }
                ExifInterface.ORIENTATION_TRANSVERSE -> {
                    matrix.postRotate(-90f); matrix.postScale(-1f, 1f)
                }
                else -> return bitmap
            }

            Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
        } catch (e: Exception) {
            android.util.Log.e("JIXOZMED", "❌ Ошибка fixOrientation: ${e.message}")
            bitmap
        }
    }

    // ==========================================================
    // ВРЕМЕННЫЙ ФАЙЛ ДЛЯ КАМЕРЫ
    // ==========================================================
    private fun createImageFile(): File {
        val ts = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val dir = getExternalFilesDir(Environment.DIRECTORY_PICTURES) ?: cacheDir
        return File.createTempFile("ORIG_${ts}_", ".jpg", dir)
    }

    // ==========================================================
    // WEBVIEW
    // ==========================================================
    @SuppressLint("SetJavaScriptEnabled")
    @Composable
    fun LocalWebViewScreen() {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
            AndroidView(
                modifier = Modifier.fillMaxSize().padding(innerPadding),
                factory = { context ->
                    WebView(context).apply {
                        webViewClient = WebViewClient()
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.allowFileAccess = true
                        settings.allowContentAccess = true
                        settings.loadWithOverviewMode = true
                        settings.useWideViewPort = true
                        settings.allowFileAccessFromFileURLs = true
                        settings.allowUniversalAccessFromFileURLs = true
                        settings.builtInZoomControls = false
                        settings.displayZoomControls = false
                        settings.setGeolocationEnabled(true)

                        // JS-мост для кнопки «Открыть последний»
                        addJavascriptInterface(this@MainActivity, "AndroidBridge")

                        // ==============================================
                        // СКАЧИВАНИЕ
                        // ==============================================
                        setDownloadListener(DownloadListener { url, userAgent,
                                                               contentDisposition, mimetype, _ ->
                            try {
                                android.util.Log.d("JIXOZMED", "⬇️ onDownloadStart: $url")

                                var fileName = Uri.parse(url).getQueryParameter("filename")
                                if (fileName.isNullOrBlank()) {
                                    fileName = URLUtil.guessFileName(
                                        url, contentDisposition, mimetype
                                    )
                                }

                                val mime = mimeForFileName(
                                    fileName,
                                    if (mimetype.isNullOrBlank()) "application/octet-stream" else mimetype
                                )

                                val request = DownloadManager.Request(Uri.parse(url))
                                request.setMimeType(mime)
                                CookieManager.getInstance().getCookie(url)?.let {
                                    request.addRequestHeader("cookie", it)
                                }
                                request.addRequestHeader("User-Agent", userAgent)
                                request.setTitle(fileName)
                                request.setDescription("Скачивание документа…")
                                request.setNotificationVisibility(
                                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_ONLY_COMPLETION
                                )
                                request.setDestinationInExternalPublicDir(
                                    Environment.DIRECTORY_DOWNLOADS, fileName
                                )

                                val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                                lastDownloadId = dm.enqueue(request)
                                android.util.Log.d("JIXOZMED",
                                    "📥 enqueued: id=$lastDownloadId  file=$fileName")

                                Toast.makeText(
                                    applicationContext,
                                    "Скачивание: $fileName",
                                    Toast.LENGTH_SHORT
                                ).show()
                            } catch (e: Exception) {
                                android.util.Log.e("JIXOZMED",
                                    "❌ Ошибка скачивания: ${e.message}")
                                Toast.makeText(
                                    applicationContext,
                                    "Ошибка: ${e.message}",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        })

                        webChromeClient = object : WebChromeClient() {
                            override fun onShowFileChooser(
                                webView: WebView?,
                                cb: ValueCallback<Array<Uri>>?,
                                params: FileChooserParams?
                            ): Boolean {
                                filePathCallback?.onReceiveValue(null)
                                filePathCallback = cb
                                val isCapture = params?.isCaptureEnabled == true
                                return try {
                                    val intent = if (isCapture) {
                                        val f = createImageFile()
                                        currentPhotoFile = f
                                        val uri = FileProvider.getUriForFile(
                                            this@MainActivity,
                                            "${packageName}.fileprovider", f)
                                        Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                                            putExtra(MediaStore.EXTRA_OUTPUT, uri)
                                            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                                        }
                                    } else params?.createIntent()
                                    fileChooserLauncher.launch(intent)
                                    true
                                } catch (e: Exception) {
                                    filePathCallback = null
                                    currentPhotoFile = null
                                    false
                                }
                            }

                            override fun onGeolocationPermissionsShowPrompt(
                                origin: String?,
                                callback: GeolocationPermissions.Callback?
                            ) {
                                callback?.invoke(origin, true, false)
                            }
                        }
                        loadUrl("file:///android_asset/dashboard.html")
                    }
                }
            )
        }
    }
}