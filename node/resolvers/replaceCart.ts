import { BUCKET, DEFAULT_SETTINGS, SETTINGS_PATH } from '../constants';
import { mergeItems } from '../utils'

/**
 * Cross cart main feature
 * @returns {PartialOrderForm}
 * @typedef PartialOrderForm a partial orderform, fielded
 * to update Store Framework's context relevant data.
 */
export const replaceCart = async (
  _: any,
  { savedCart, currentCart, strategy, userType, categoriesIds }: ReplaceCartVariables,
  context: Context
): Promise<PartialOrderForm | null> => {
  const {
    clients: { checkoutIO, requestHub },
    response,
  } = context
  const sgrCategoriesIds: string[] = categoriesIds ? categoriesIds.trim().split(',') : [];

  if (userType != "CALL_CENTER_OPERATOR") {
    const host = context.get('x-forwarded-host')

    response.set(
      'set-cookie',
      `checkout.vtex.com=__ofid=${savedCart}; Max-Age=15552000; Domain=${host}; path=/; secure; samesite=lax; httponly`
    )

    const orderForm = await checkoutIO.getOrderForm(savedCart)

    if (strategy !== 'REPLACE') {
      /**
       * Add to cart has a specific graphql INPUT type.
       * These calls ensure handling correct types from start to finish.
       */
      const savedItems = await checkoutIO.getItems(savedCart)
      const currentItems = await checkoutIO.getItems(currentCart)

      const tally = strategy === 'COMBINE'

      const items = mergeItems(currentItems, savedItems, tally)

      // filter items that have no parentItemIndex and match the guarantee name
      const filteredItems = items.filter(item => {
        const categories = Object.keys(item.productCategories);
        const isSgrOrService = categories.some(category => sgrCategoriesIds.includes(category));
        return !isSgrOrService;
      });

      if (!items.length) {
        return orderForm
      }

      await requestHub.clearCart(savedCart)

      const finalItems = filteredItems.map((item) => ({
        id: Number(item.id),
        quantity: item.quantity,
        seller: item.seller,
        index: item.index,
        options: item.options
      }))

      const newOrderForm = await checkoutIO.addToCart(savedCart, finalItems)

      return newOrderForm
    }

    return orderForm

  } else {
    return null

  }
}
