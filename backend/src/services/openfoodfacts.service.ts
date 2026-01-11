import axios, { AxiosError } from 'axios';

/**
 * OpenFoodFacts API Response Types
 */
interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_en?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  brands?: string;
  code?: string;
  image_url?: string;
  image_front_url?: string;
  nutriments?: {
    [key: string]: any;
  };
  last_modified_t?: number;
}

interface OpenFoodFactsResponse {
  status: number; // 1 = found, 0 = not found
  code: string;
  product?: OpenFoodFactsProduct;
  status_verbose?: string;
}

/**
 * Our standardized product lookup result
 */
export interface ProductLookupResult {
  found: boolean;
  productName: string | null;
  ingredients: string | null;
  barcode: string;
  brand: string | null;
  imageUrl?: string | null;
  lastModified?: Date | null;
}

/**
 * Fetch product information from OpenFoodFacts API by barcode
 * @param barcode - The product barcode (EAN-13, UPC, etc.)
 * @returns ProductLookupResult with product data or null if error
 */
export async function fetchProductByBarcode(
  barcode: string
): Promise<ProductLookupResult | null> {
  try {
    // Validate barcode
    if (!barcode || barcode.trim().length === 0) {
      console.error('Invalid barcode: empty or null');
      return null;
    }

    // Clean barcode (remove spaces, special characters)
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
    
    if (cleanBarcode.length < 8) {
      console.error('Invalid barcode: too short');
      return null;
    }

    console.log(`🔍 Looking up barcode: ${cleanBarcode} in OpenFoodFacts...`);

    // Call OpenFoodFacts API v2
    const response = await axios.get<OpenFoodFactsResponse>(
      `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
      {
        timeout: 5000, // 5 second timeout
        headers: {
          'User-Agent': 'Defendish-AllergenApp/1.0', // Polite API usage
        },
      }
    );

    // Check if product was found
    if (response.data.status === 0 || !response.data.product) {
      console.log(`❌ Product not found in OpenFoodFacts: ${cleanBarcode}`);
      return {
        found: false,
        productName: null,
        ingredients: null,
        barcode: cleanBarcode,
        brand: null,
        imageUrl: null,
        lastModified: null,
      };
    }

    const product = response.data.product;

    // Extract product name (prefer English, fallback to default)
    const productName =
      product.product_name_en ||
      product.product_name ||
      null;

    // Extract ingredients (prefer English, fallback to default)
    const ingredients =
      product.ingredients_text_en ||
      product.ingredients_text ||
      null;

    // Extract brand
    const brand = product.brands || null;

    // Extract image URL
    const imageUrl = product.image_front_url || product.image_url || null;

    // Extract last modified timestamp
    const lastModified = product.last_modified_t
      ? new Date(product.last_modified_t * 1000)
      : null;

    console.log(`✅ Product found: ${productName || 'Unknown'}`);
    console.log(`   Brand: ${brand || 'Unknown'}`);
    console.log(`   Ingredients: ${ingredients ? 'Yes' : 'No'}`);

    return {
      found: true,
      productName,
      ingredients,
      barcode: cleanBarcode,
      brand,
      imageUrl,
      lastModified,
    };
  } catch (error) {
    // Handle different types of errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        console.error('OpenFoodFacts API timeout');
      } else if (axiosError.response?.status === 429) {
        console.error('OpenFoodFacts API rate limit exceeded');
      } else if (axiosError.response?.status === 404) {
        console.log(`Product not found: ${barcode}`);
        return {
          found: false,
          productName: null,
          ingredients: null,
          barcode: barcode.trim().replace(/[^0-9]/g, ''),
          brand: null,
        };
      } else {
        console.error('OpenFoodFacts API error:', axiosError.message);
      }
    } else {
      console.error('Unexpected error in fetchProductByBarcode:', error);
    }

    // Return null on error (graceful degradation)
    return null;
  }
}

/**
 * Check if OpenFoodFacts API is accessible
 * @returns boolean indicating if API is reachable
 */
export async function isOpenFoodFactsAvailable(): Promise<boolean> {
  try {
    const response = await axios.get(
      'https://world.openfoodfacts.org/api/v2/product/3017620422003.json', // Test with Nutella barcode
      { timeout: 3000 }
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
