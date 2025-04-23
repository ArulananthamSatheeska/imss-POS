import { useState, useEffect } from 'react';
import { itemsApi } from '../services/api';

export function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await itemsApi.getItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item) => {
    try {
      const newItem = await itemsApi.addItem(item);
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError('Failed to add item');
      throw err;
    }
  };

  const updateItem = async (id, item) => {
    try {
      const updatedItem = await itemsApi.updateItem(id, item);
      setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
      return updatedItem;
    } catch (err) {
      setError('Failed to update item');
      throw err;
    }
  };

  const deleteItem = async (id) => {
    try {
      await itemsApi.deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete item');
      throw err;
    }
  };

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    reload: loadItems
  };
}
