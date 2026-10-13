import { render, screen } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import userEvent from '@testing-library/user-event';

// A test component to interact with CartContext
function TestComponent() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  return (
    <div>
      <button
        onClick={() =>
          addItem({ id: 1, title: 'Test Product', price: 10, quantity: 2 })
        }
      >
        Add Item
      </button>
      <button onClick={() => removeItem(1)}>Remove Item</button>
      <button onClick={() => updateQuantity(1, 5)}>Update Quantity</button>
      <button onClick={clearCart}>Clear Cart</button>

      <div data-testid="items">{JSON.stringify(items)}</div>
      <div data-testid="totalItems">{totalItems}</div>
      <div data-testid="totalPrice">{totalPrice}</div>
    </div>
  );
}

describe('CartProvider', () => {
  beforeEach(() => {
    localStorage.clear(); // reset between tests
  });

  function renderWithProvider() {
    return render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
  }

  test('adds item to cart and calculates total', async () => {
    renderWithProvider();
    await userEvent.click(screen.getByText('Add Item'));

    expect(screen.getByTestId('items')).toHaveTextContent('Test Product');
    expect(screen.getByTestId('totalItems')).toHaveTextContent('2');
    expect(screen.getByTestId('totalPrice')).toHaveTextContent('20');
  });

  test('removes item from cart', async () => {
    renderWithProvider();
    await userEvent.click(screen.getByText('Add Item'));
    await userEvent.click(screen.getByText('Remove Item'));

    expect(screen.getByTestId('items')).toHaveTextContent('[]');
    expect(screen.getByTestId('totalItems')).toHaveTextContent('0');
    expect(screen.getByTestId('totalPrice')).toHaveTextContent('0');
  });

  test('updates quantity of an item', async () => {
    renderWithProvider();
    await userEvent.click(screen.getByText('Add Item'));
    await userEvent.click(screen.getByText('Update Quantity'));

    expect(screen.getByTestId('totalItems')).toHaveTextContent('5');
    expect(screen.getByTestId('totalPrice')).toHaveTextContent('50');
  });

  test('clears the cart', async () => {
    renderWithProvider();
    await userEvent.click(screen.getByText('Add Item'));
    await userEvent.click(screen.getByText('Clear Cart'));

    expect(screen.getByTestId('items')).toHaveTextContent('[]');
    expect(screen.getByTestId('totalItems')).toHaveTextContent('0');
  });
});
