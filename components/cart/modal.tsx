'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import LoadingDots from 'components/loading-dots';
import Price from 'components/price';
import { DEFAULT_OPTION } from 'lib/constants';
import { createUrl } from 'lib/utils';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '../ui/button';
import { createCartAndSetCookie, redirectToCheckout } from './actions';
import { useCart } from './cart-context';
import { DeleteItemButton } from './delete-item-button';
import { EditItemQuantityButton } from './edit-item-quantity-button';
import OpenCart from './open-cart';

type MerchandiseSearchParams = {
  [key: string]: string;
};

export default function CartModal() {
  const { cart, updateCartItem } = useCart();
  const quantityRef = useRef(cart?.totalQuantity);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  const closeCart = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button aria-label="Open cart">
          <OpenCart quantity={quantityRef.current} />
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>
          <SheetDescription>Items in your cart</SheetDescription>
        </SheetHeader>

        {!cart || cart.lines.length === 0 ? (
          <div className="mt-20 flex w-full flex-col items-center justify-center overflow-hidden">
            <ShoppingCart className="h-16" />
            <p className="mt-6 text-center text-2xl font-bold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-between">
            <ul className="flex-1 overflow-auto py-4">
              {cart.lines
                .sort((a, b) =>
                  a.merchandise.product.title.localeCompare(b.merchandise.product.title)
                )
                .map((item, i) => {
                  const merchandiseSearchParams = {} as MerchandiseSearchParams;

                  item.merchandise.selectedOptions.forEach(({ name, value }) => {
                    if (value !== DEFAULT_OPTION) {
                      merchandiseSearchParams[name.toLowerCase()] = value;
                    }
                  });

                  const merchandiseUrl = createUrl(
                    `/product/${item.merchandise.product.handle}`,
                    new URLSearchParams(merchandiseSearchParams)
                  );

                  return (
                    <li
                      key={i}
                      className="flex w-full flex-col border-b border-neutral-300 dark:border-neutral-700"
                    >
                      <div className="relative flex w-full flex-row justify-between px-1 py-4">
                        <div className="absolute z-40 -ml-1 -mt-2">
                          <DeleteItemButton item={item} optimisticUpdate={updateCartItem} />
                        </div>
                        <div className="flex flex-row">
                          <div className="relative h-16 w-16 overflow-hidden rounded-md border border-neutral-300 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                            <Image
                              className="h-full w-full object-cover"
                              width={64}
                              height={64}
                              alt={
                                item.merchandise.product.featuredImage.altText ||
                                item.merchandise.product.title
                              }
                              src={item.merchandise.product.featuredImage.url}
                            />
                          </div>
                          <Link
                            href={merchandiseUrl}
                            onClick={closeCart}
                            className="z-30 ml-2 flex flex-row space-x-4"
                          >
                            <div className="flex flex-1 flex-col text-base">
                              <span className="leading-tight">
                                {item.merchandise.product.title}
                              </span>
                              {item.merchandise.title !== DEFAULT_OPTION ? (
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {item.merchandise.title}
                                </p>
                              ) : null}
                            </div>
                          </Link>
                        </div>
                        <div className="flex h-16 flex-col justify-between">
                          <Price
                            className="flex justify-end space-y-2 text-right text-sm"
                            amount={item.cost.totalAmount.amount}
                            currencyCode={item.cost.totalAmount.currencyCode}
                          />
                          <div className="ml-auto flex h-9 flex-row items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                            <EditItemQuantityButton
                              item={item}
                              type="minus"
                              optimisticUpdate={updateCartItem}
                            />
                            <p className="w-6 text-center">
                              <span className="w-full text-sm">{item.quantity}</span>
                            </p>
                            <EditItemQuantityButton
                              item={item}
                              type="plus"
                              optimisticUpdate={updateCartItem}
                            />
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
            <SheetFooter className="sticky bottom-6 !flex-col border-t border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
              <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 dark:border-neutral-700">
                  <p>Taxes</p>
                  <Price
                    className="text-right text-base text-black dark:text-white"
                    amount={cart.cost.totalTaxAmount.amount}
                    currencyCode={cart.cost.totalTaxAmount.currencyCode}
                  />
                </div>
                <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                  <p>Shipping</p>
                  <p className="text-right">Calculated at checkout</p>
                </div>
                <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                  <p>Total</p>
                  <Price
                    className="text-right text-base text-black dark:text-white"
                    amount={cart.cost.totalAmount.amount}
                    currencyCode={cart.cost.totalAmount.currencyCode}
                  />
                </div>
              </div>
              <form action={redirectToCheckout}>
                <CheckoutButton />
              </form>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full rounded-full bg-blue-600 p-3 text-center hover:bg-blue-700"
      type="submit"
      disabled={pending}
      variant="default"
    >
      {pending ? <LoadingDots className="bg-white" /> : 'Proceed to Checkout'}
    </Button>
  );
}
