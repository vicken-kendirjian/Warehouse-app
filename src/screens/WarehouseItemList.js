import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, Button } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system'

const db = SQLite.openDatabase('products.db');

export default function WarehouseItemList({ route }) {
  const { warehouseId, warehouseName, secondHelper } = route.params;
  const [items, setItems] = useState([]);
  const [editedQuantity, setEditedQuantity] = useState({});
  const [deletedItemId, setDeletedItemId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [counter, setCounter] = useState(0);


  useEffect(() => {
    fetchWarehouseItems();
  }, [warehouseId, secondHelper, counter]);

  const fetchWarehouseItems = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS warehouse_items (id INTEGER PRIMARY KEY AUTOINCREMENT, warehouse_id INTEGER, code TEXT, description TEXT, saleprice TEXT, quantity INTEGER)',
        [],
        () => console.log('Warehouse items table created successfully'),
        (_, error) => console.log('Error creating warehouse items table:', error)
      );

      tx.executeSql(
        'SELECT * FROM warehouse_items WHERE warehouse_id = ?',
        [warehouseId],
        (_, result) => {
          const data = result.rows._array;
          setItems(data);
          const editedQuantityMap = {};
          data.forEach((item) => {
            editedQuantityMap[item.id] = item.quantity;
          });
          setEditedQuantity(editedQuantityMap);
        },
        (_, error) => {
          console.log('Error fetching warehouse items:', error);
        }
      );
    });
  };

  const handleSaveEditedQuantity = () => {
    if (currentItemId && newQuantity !== '') {
      const parsedNewQuantity = parseInt(newQuantity);
      if (!isNaN(parsedNewQuantity) && parsedNewQuantity >= 0) {
        setEditedQuantity((prevEditedQuantity) => ({
          ...prevEditedQuantity,
          [currentItemId]: parsedNewQuantity,
        }));

        db.transaction((tx) => {
          tx.executeSql(
            'UPDATE warehouse_items SET quantity = ? WHERE id = ?',
            [parsedNewQuantity, currentItemId],
            () => {
              console.log('Quantity updated successfully');
            },
            (_, error) => {
              console.log('Error updating quantity:', error);
            }
          );
        });

        setModalVisible(false);
      } else {
        console.log('Invalid quantity');
      }
    }
  };

  const handleDeleteItem = (itemId) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM warehouse_items WHERE id = ?',
        [itemId],
        () => {
          console.log('Item deleted successfully');
          setDeletedItemId(itemId);
        },
        (_, error) => {
          console.log('Error deleting item:', error);
        }
      );
    });
    setCounter(counter+1);
  };

  const handleEditQuantity = (itemId) => {
    setCurrentItemId(itemId);
    setNewQuantity(editedQuantity[itemId] !== undefined ? editedQuantity[itemId].toString() : '');
    setModalVisible(true);
  };

  const handleConfirmDeleteItem = (itemId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteItem(itemId),
        },
      ],
      { cancelable: false }
    );
  };

  useEffect(() => {
    if (deletedItemId) {
      fetchWarehouseItems();
      setDeletedItemId(null);
    }
  }, [deletedItemId]);


  const handleExportList = async () => {
    try {
      const fileName = warehouseId+'-'+Date.now()+'.txt';
      const data = items.map((item) => `${item.code}, ${item.description}, ${item.quantity}`).join('\n\n');
      const filePath = FileSystem.documentDirectory + fileName;
  
      await FileSystem.writeAsStringAsync(filePath, data, { encoding: FileSystem.EncodingType.UTF8 });
  
      await Sharing.shareAsync(filePath, { mimeType: 'text/plain', dialogTitle: 'Export List' });
    } catch (error) {
      console.log('Error exporting list:', error);
    }
  };

  const renderItem = ({ item }) => {
    const itemId = item.id;
    const quantity = editedQuantity[itemId] !== undefined ? editedQuantity[itemId].toString() : item.quantity.toString();

    return (
      <View style={styles.productItem}>
        <Text style={styles.productCode}>Code: {item.code}</Text>
        <Text style={styles.productDescription}>Item: {item.description}</Text>
        <Text style={styles.productQuantity}>Quantity: {quantity}</Text>
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleEditQuantity(itemId)} />
          <Button title="Delete" onPress={() => handleConfirmDeleteItem(itemId)} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <Text style={styles.noItemsText}>No items in this warehouse</Text>
      ) : (
        <>
          <FlatList data={items} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} />
          <Modal visible={modalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.editQuantity}>Edit Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={newQuantity}
                  onChangeText={(text) => setNewQuantity(text)}
                />
                <View style={styles.modalButtonContainer}>
                  <Button title="Save" onPress={handleSaveEditedQuantity} />
                  <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
                </View>
              </View>
            </View>
          </Modal>
         <Button title='Export' onPress={handleExportList}/>
        </>
      )}
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    margin: 1
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 20,
    borderRadius: 8,
    elevation: 2,
  },
  productCode: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  productQuantity: {
    fontSize: 19,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noItemsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  quantityInput: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
    marginTop:10,
    height: 30
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    width: 240
  },
  editQuantity: {
    fontSize: 20,
    marginBottom: 10
  }
});
