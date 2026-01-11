export const parseIngredients = (rawText: string): string[] => {
  // Clean and parse ingredients from raw text
  const text = rawText.toLowerCase().trim();
  
  // Split by common delimiters
  let ingredients = text
    .split(/[,;.\n]/)
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0);

  // Remove common non-ingredient words
  const stopWords = [
    'ingredients',
    'contains',
    'may contain',
    'including',
    'and',
    'or',
    'the',
    'with',
  ];

  ingredients = ingredients.filter((ingredient) => {
    const words = ingredient.split(' ');
    return !stopWords.includes(ingredient) && words.length <= 5;
  });

  // Extract meaningful ingredients (basic cleaning)
  ingredients = ingredients.map((ingredient) => {
    // Remove percentages and parentheses content
    return ingredient
      .replace(/\([^)]*\)/g, '')
      .replace(/\d+%?/g, '')
      .trim();
  }).filter((ingredient) => ingredient.length > 2);

  return [...new Set(ingredients)]; // Remove duplicates
};

export const matchAllergens = (
  ingredients: string[],
  allergies: string[]
): { matched: string[]; unmatched: string[] } => {
  const matched: string[] = [];
  const normalizedAllergies = allergies.map((a) => a.toLowerCase());

  ingredients.forEach((ingredient) => {
    const normalizedIngredient = ingredient.toLowerCase();
    
    normalizedAllergies.forEach((allergy) => {
      if (
        normalizedIngredient.includes(allergy) ||
        allergy.includes(normalizedIngredient)
      ) {
        if (!matched.includes(allergy)) {
          matched.push(allergy);
        }
      }
    });
  });

  const unmatched = normalizedAllergies.filter((a) => !matched.includes(a));

  return { matched, unmatched };
};
