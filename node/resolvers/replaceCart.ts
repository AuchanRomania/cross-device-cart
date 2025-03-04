import { mergeItems } from '../utils'

/**
 * Cross cart main feature
 * @returns {PartialOrderForm}
 * @typedef PartialOrderForm a partial orderform, fielded
 * to update Store Framework's context relevant data.
 */
export const replaceCart = async (
  _: any,
  { savedCart, currentCart, strategy, userType }: ReplaceCartVariables,
  context: Context
): Promise<PartialOrderForm | null> => {
  const {
    clients: { checkoutIO, requestHub },
    response,
  } = context

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
      console.log('items before filter', items.length);

      // filter items that have no parentItemIndex and match the guarantee name
      const filteredItems = items.filter(item => {
        if (!item.parentItemIndex && matchSgrName(item.name!)) {
          return false
        }
        return true;
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
        options: item.options,
      }))
      console.log('finalItems', finalItems.length, finalItems);
      const newOrderForm = await checkoutIO.addToCart(savedCart, finalItems)

      return newOrderForm
    }

    return orderForm

  } else {
    return null

  }
}

/**
 * Checks if an input string matches any of the predefined guarantee names.
 * Performs case-insensitive matching and handles various separator characters.
 * Also handles the optional "SGR" text that might appear in the input.
 *
 * @param input - The string to check
 * @returns boolean - True if the input matches any predefined guarantee name, false otherwise
 */
function matchSgrName(input: string): boolean {
  console.log('input', input);
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Define the base guarantee patterns
  const validMaterials = ['STICLA', 'PLASTIC', 'DOZA', ''];
  const validQuantities = ['X12', 'X6', 'X2', '', 'X1'];

  // Normalize the input string:
  // 1. Convert to uppercase
  // 2. Replace any separator characters (-, _, ., ,) with spaces
  // 3. Replace multiple spaces with a single space
  // 4. Trim spaces from start and end
  let normalizedInput = input.toUpperCase()
    .replace(/[-_.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Save the original input before SGR removal for testing standalone
  const beforeSgrRemoval = normalizedInput;

  // Remove "SGR" if present
  normalizedInput = normalizedInput.replace(/\bSGR\b\s*/g, '').trim();

  // Create array of all valid patterns
  const validPatterns = [];

  // Add "GARANTIE" by itself
  validPatterns.push("GARANTIE");

  // Add "GARANTIE" with valid quantities
  for (const quantity of validQuantities) {
    if (quantity !== '') {
      validPatterns.push(`GARANTIE ${quantity}`);
    }
  }

  // Add all material + quantity combinations
  for (const material of validMaterials) {
    if (material === '') continue; // Skip empty material

    // Add material without quantity
    validPatterns.push(`GARANTIE ${material}`);

    // Add material with quantities
    for (const quantity of validQuantities) {
      if (quantity === '') continue; // Skip empty quantity since we already added material alone
      validPatterns.push(`GARANTIE ${material} ${quantity}`);
    }
  }

  // Check if the normalized string matches any valid pattern
  if (validPatterns.includes(normalizedInput)) {
    return true;
  }

  // Special check for "GARANTIE SGR X#" patterns
  // If we find "GARANTIE X#" after removing SGR, it should match
  if (beforeSgrRemoval.match(/^GARANTIE\s+SGR\s+X\d+$/) &&
    normalizedInput.match(/^GARANTIE\s+X\d+$/)) {
    return true;
  }

  return false;
}
