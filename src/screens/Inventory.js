import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('products.db');

export default function WarehouseList({whID, setWHID, secondHelper}) {
  const [warehouses, setWarehouses] = useState([]);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newWarehouseNumber, setNewWarehouseNumber] = useState('');
  const [newWarehouseDate, setNewWarehouseDate] = useState('');
  const [selectedWH, setSelectedWH] = useState('N/A');
  const navigation = useNavigation();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS warehouse_items (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, description TEXT, saleprice TEXT, quantity INTEGER, warehouse_id INTEGER)',
        [],
        () => console.log('Warehouse items table created successfully'),
        (_, error) => console.log('Error creating warehouse items table:', error)
      );
    });
  }, []);

  const fetchWarehouses = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS warehouses (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, number TEXT, date TEXT)',
        [],
        () => console.log('Warehouses table created successfully'),
        (_, error) => console.log('Error creating warehouses table:', error)
      );

      tx.executeSql(
        'SELECT * FROM warehouses',
        [],
        (_, result) => {
          const data = result.rows._array;
          setWarehouses(data);
        },
        (_, error) => {
          console.log('Error fetching warehouses:', error);
        }
      );
    });
  };

  const handleAddWarehouse = () => {
    if (newWarehouseName.trim() !== '' && newWarehouseNumber.trim() !== '' && newWarehouseDate.trim() !== '') {
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO warehouses (name, number, date) VALUES (?, ?, ?)',
          [newWarehouseName, newWarehouseNumber, newWarehouseDate],
          () => {
            console.log('Warehouse added successfully');
            fetchWarehouses();
            setNewWarehouseName('');
            setNewWarehouseNumber('');
            setNewWarehouseDate('');
          },
          (_, error) => {
            console.log('Error adding warehouse:', error);
          }
        );
      });
    }
  };

  const handleWarehouseClick = (warehouse) => {
    navigation.navigate('Lists', { warehouseId: warehouse.id, warehouseName: warehouse.name, secondHelper: secondHelper });
  };

  const handleDeleteWarehouse = (warehouseId) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM warehouses WHERE id = ?',
        [warehouseId],
        () => {
          console.log('Warehouse deleted successfully');
          fetchWarehouses();
        },
        (_, error) => {
          console.log('Error deleting warehouse:', error);
        }
      );
  
      tx.executeSql(
        'DELETE FROM warehouse_items WHERE warehouse_id = ?',
        [warehouseId],
        () => {
          console.log('Warehouse items deleted successfully');
        },
        (_, error) => {
          console.log('Error deleting warehouse items:', error);
        }
      );
      setSelectedWH("N/A");
      setWHID();
    });
  };
  

  const handleEditWarehouse = (warehouseId, warehouseNum) => {
    setWHID(warehouseId)
    setSelectedWH(warehouseNum)
    console.log('NEW' + whID);
    navigation.navigate('Display')
  };

  const renderWarehouseItem = ({ item }) => (
    <TouchableOpacity style={styles.warehouseItem} onPress={() => handleWarehouseClick(item)}>
      <Text style={styles.warehouseName}>{item.name}</Text>
      <Text style={styles.warehouseNumber}>Number: {item.number}</Text>
      <Text style={styles.warehouseDate}>Date: {item.date}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Select" onPress={() => handleEditWarehouse(item.id, item.number)} />
        <Button title="Delete Warehouse" onPress={() => handleDeleteWarehouse(item.id)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Warehouses</Text>
      <Text style={styles.header}>Selected Warehouse: {selectedWH}</Text>

      <View style={styles.addWarehouseContainer}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={newWarehouseName}
          onChangeText={setNewWarehouseName}
        />
        <TextInput
          style={styles.input}
          placeholder="Number"
          value={newWarehouseNumber}
          onChangeText={setNewWarehouseNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Date"
          value={newWarehouseDate}
          onChangeText={setNewWarehouseDate}
        />
        <Button title="Add" onPress={handleAddWarehouse} />
      </View>
      <FlatList
        data={warehouses}
        renderItem={renderWarehouseItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addWarehouseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  warehouseItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  warehouseName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8
  },
  warehouseNumber: {
    fontSize: 17,
    marginBottom: 8
  },
  warehouseDate: {
    fontSize: 17,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
