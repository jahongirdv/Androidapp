import React, { useEffect } from 'react';
import Header from '../components/Header';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import LoadingOverlay from '../components/LoadingOverly';
import { getRandomColor } from '@sarawebs/sb-utils';
import { useApp } from '../context/AppContext';
import Copyright from '../components/Copyright';
import { useMessages } from '../context/MessageContext';

const colors = [
  '345 75% 31%', // #8e1330
  '43 66% 32%', // #8a6c1d
  '163 23% 32%', // #406555
  '331 77% 27%', // #7c0e45
  '320 70% 32%', // #8d1978
  '291 61% 53%', // #cc38d7
  '165 7% 30%', // #47504e
  '168 79% 36%', // #0fa080
  '200 81% 34%', // #0f64a0
  '257 81% 34%', // #460fa0
  '327 81% 34%', // #a00f65
  '348 81% 34%', // #a00f24
  '187 81% 34%', // #0f94a0
  '160 81% 34%', // #0fa067
  '150 81% 34%', // #0fa03c
  '110 81% 34%', // #38a00f
  '58 81% 34%', // #a09d0f
  '38 81% 34%', // #a0670f
  '24 81% 34%', // #a0370f
  '0 81% 34%', // #a00f0f
  '218 64% 48%', // #2e6bc6
  '201 76% 47%', // #1992d4
];
export default function Root() {
  const { appName } = useApp();
  const location = useLocation();
  const { loading } = useMessages();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--primary',
      getRandomColor(colors)
    );
  }, []);

  return (
    <>
      <Header />

      <main>
        <div className="wrap">
          {loading && <LoadingOverlay />}
          {!loading && <Outlet />}
        </div>
      </main>

      <Footer className="mt-auto p-2 dark:bg-primaryDark">
        <Copyright appName={appName} />
      </Footer>
    </>
  );
}
