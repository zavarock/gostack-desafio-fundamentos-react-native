import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];

  addToCart(item: Omit<Product, 'quantity'>): void;

  increment(id: string): void;

  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (cartProducts) {
        setProducts(JSON.parse(cartProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const findProduct = products.findIndex(
        cartProduct => cartProduct.id === product.id,
      );

      const cartProducts = [...products];
      if (findProduct >= 0) {
        cartProducts[findProduct].quantity += 1;
      } else {
        cartProducts.push({ ...product, quantity: 1 });
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(cartProducts),
      );

      setProducts(cartProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const cartProducts = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }

        return product;
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(cartProducts),
      );

      setProducts(cartProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const cartProducts = products
        .map(product => {
          if (product.id === id) {
            return {
              ...product,
              quantity: product.quantity - 1,
            };
          }

          return product;
        })
        .filter(product => product.quantity >= 1);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(cartProducts),
      );

      setProducts(cartProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
