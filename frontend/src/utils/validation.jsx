export const validateItem = (item) => {
  const errors = [];

  if (!item.name?.trim()) {
    errors.push('Name is required');
  }

  if (typeof item.price !== 'number' || item.price < 0) {
    errors.push('Price must be a positive number');
  }

  if (typeof item.stock !== 'number' || item.stock < 0) {
    errors.push('Stock must be a positive number');
  }

  if (!item.category?.trim()) {
    errors.push('Category is required');
  }

  return errors;
};
