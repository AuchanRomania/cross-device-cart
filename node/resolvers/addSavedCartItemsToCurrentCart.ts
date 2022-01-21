import type { OrderForm as CheckoutOrderForm } from 'vtex.checkout-graphql'

export const addSavedCartItemsToCurrentCart = async (
  _: any,
  { savedCart, currentCart }: { savedCart: string; currentCart: string },
  ctx: Context
): Promise<CheckoutOrderForm | null> => {
  const {
    clients: { checkout },
  } = ctx

  try {
    const savedCartOrderForm = await checkout.getOrderForm(savedCart)

    if (!savedCartOrderForm.items.length) {
      return null
    }

    const orderForm = await checkout.addItems(
      currentCart,
      savedCartOrderForm.items
    )

    return orderForm
  } catch (err) {
    throw err
  }
}
