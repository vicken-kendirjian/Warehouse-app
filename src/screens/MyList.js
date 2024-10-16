// import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Button, Modal } from 'react-native';
// import * as SQLite from 'expo-sqlite';

// const db = SQLite.openDatabase('products.db');

// export default function WarehouseItemList({ route }) {
//   const { warehouseId, warehouseName } = route.params;
//   const [items, setItems] = useState([]);
//   const [editedQuantity, setEditedQuantity] = useState({});
//   const [deletedItemId, setDeletedItemId] = useState(null);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [currentItemId, setCurrentItemId] = useState(null);
//   const [newQuantity, setNewQuantity] = useState('');

//   useEffect(() => {
//     fetchWarehouseItems();
//   }, [warehouseId]);

//   const fetchWarehouseItems = () => {
//     db.transaction((tx) => {
//       tx.executeSql(
//         'CREATE TABLE IF NOT EXISTS warehouse_items (id INTEGER PRIMARY KEY AUTOINCREMENT, warehouse_id INTEGER, code TEXT, description TEXT, saleprice TEXT, quantity INTEGER)',
//         [],
//         () => console.log('Warehouse items table created successfully'),
//         (_, error) => console.log('Error creating warehouse items table:', error)
//       );

//       tx.executeSql(
//         'SELECT * FROM warehouse_items WHERE warehouse_id = ?',
//         [warehouseId],
//         (_, result) => {
//           const data = result.rows._array;
//           setItems(data);
//           const editedQuantityMap = {};
//           data.forEach((item) => {
//             editedQuantityMap[item.id] = item.quantity;
//           });
//           setEditedQuantity(editedQuantityMap);
//         },
//         (_, error) => {
//           console.log('Error fetching warehouse items:', error);
//         }
//       );
//     });
//   };

//   const handleSaveQuantity = (itemId) => {
//     if (editedQuantity[itemId] !== undefined) {
//       db.transaction((tx) => {
//         tx.executeSql(
//           'UPDATE warehouse_items SET quantity = ? WHERE id = ?',
//           [editedQuantity[itemId], itemId],
//           () => {
//             console.log('Quantity updated successfully');
//           },
//           (_, error) => {
//             console.log('Error updating quantity:', error);
//           }
//         );
//       });
//     }
//   };

//   const handleDeleteItem = (itemId) => {
//     db.transaction((tx) => {
//       tx.executeSql(
//         'DELETE FROM warehouse_items WHERE id = ?',
//         [itemId],
//         () => {
//           console.log('Item deleted successfully');
//           setDeletedItemId(itemId);
//         },
//         (_, error) => {
//           console.log('Error deleting item:', error);
//         }
//       );
//     });
//   };

//   const handleEditQuantity = (itemId) => {
//     setCurrentItemId(itemId);
//     setNewQuantity(editedQuantity[itemId] !== undefined ? editedQuantity[itemId].toString() : '');
//     setEditModalVisible(true);
//   };

//   const handleConfirmDeleteItem = () => {
//     // Display a confirmation popup before deleting the item
//     Alert.alert(
//       'Confirm Deletion',
//       'Are you sure you want to delete this item?',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: () => handleDeleteItem(deletedItemId),
//         },
//       ],
//       { cancelable: false }
//     );
//   };

//   useEffect(() => {
//     // Handle item deletion after confirmation
//     if (deletedItemId) {
//       fetchWarehouseItems();
//       setDeletedItemId(null);
//     }
//   }, [deletedItemId]);

//   const handleSaveEditedQuantity = () => {
//     if (currentItemId && newQuantity !== '') {
//       const parsedNewQuantity = parseInt(newQuantity);
//       if (!isNaN(parsedNewQuantity) && parsedNewQuantity >= 0) {
//         setEditedQuantity((prevEditedQuantity) => ({
//           ...prevEditedQuantity,
//           [currentItemId]: parsedNewQuantity,
//         }));
//         setEditModalVisible(false);
//       }
//     }
//   };

//   const renderItem = ({ item }) => {
//     const itemId = item.id;
//     const quantity = editedQuantity[itemId] !== undefined ? editedQuantity[itemId].toString() : item.quantity.toString();

//     return (
//       <View style={styles.productItem}>
//         <Text style={styles.productCode}>Code: {item.code}</Text>
//         <Text style={styles.productDescription}>Item: {item.description}</Text>
//         <Text style={styles.productQuantity}>Quantity: {quantity}</Text>
//         <View style={styles.buttonContainer}>
//           <Button title="Edit" onPress={() => handleEditQuantity(itemId)} />
//           <Button title="Delete" onPress={() => handleConfirmDeleteItem(itemId)} />
//         </View>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>{warehouseName}</Text>
//       {items.length === 0 ? (
//         <Text style={styles.noItemsText}>No items found for this warehouse</Text>
//       ) : (
//         <FlatList data={items} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} />
//       )}

//       {/* Edit Quantity Modal */}
//       <Modal visible={editModalVisible} animationType="slide" transparent={true}>
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <TextInput
//               style={styles.quantityInput}
//               keyboardType="numeric"
//               value={newQuantity}
//               onChangeText={(text) => setNewQuantity(text)}
//             />
//             <View style={styles.modalButtonContainer}>
//               <Button title="Save" onPress={handleSaveEditedQuantity} />
//               <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="gray" />
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   productItem: {
//     backgroundColor: '#fff',
//     padding: 16,
//     marginBottom: 20,
//     borderRadius: 8,
//     elevation: 2,
//   },
//   productCode: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   productDescription: {
//     fontSize: 17,
//     marginBottom: 10,
//     fontWeight: 'bold',
//   },
//   productQuantity: {
//     fontSize: 16,
//     marginBottom: 10,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 8,
//     elevation: 5,
//   },
//   quantityInput: {
//     borderColor: 'gray',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 8,
//     marginBottom: 10,
//   },
//   modalButtonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },
//   noItemsText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginTop: 50,
//   },
// });
