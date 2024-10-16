import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, StyleSheet, TextInput, Button } from 'react-native';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('products.db');


export default function ProductList({ sq, setList, setHelper, helper, secondHelper, setSecondHelper, whID}) {
  const [selectedFileUri, setSelectedFileUri] = useState(null);
  const [productData, setProductData] = useState([]);
  const [searchQuery, setSearchQuery] = useState(sq || '');
  const [quantityMap, setQuantityMap] = useState({});
  const navigation = useNavigation();




  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, description TEXT, saleprice TEXT, quantity INTEGER)',
        [],
        () => console.log('Table created successfully'),
        (_, error) => console.log('Error creating table:', error)
      );
    });
  }, []);
  
  useEffect(() => {
    if (selectedFileUri) {
      fetch(selectedFileUri)
        .then((response) => response.json())
        .then((data) => setProductData(data))
        .catch((error) => console.log('Error reading file:', error));
    } else {
      setProductData([]);
      setQuantityMap({});
    }
  }, [selectedFileUri]);


  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM products',
        [],
        (_, result) => {
          const data = result.rows._array;
          setProductData(data);
        },
        (_, error) => {
          console.log('Error fetching products from database:', error);
        }
      );
    });
  }, []);


  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS selected_items (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, description TEXT, saleprice TEXT, quantity INTEGER)',
        [],
        () => console.log('Selected items table created successfully'),
        (_, error) => console.log('Error creating selected items table:', error)
      );
    });
  }, []);

  useEffect(() => {
    if (sq) {
      setSearchQuery(sq);
    }
  }, [sq, helper]);

  const {
    addButton,
    addButtonContainer,
    searchContainer,
    scanButton,
    container,
    productItem,
    productCode,
    productDescription,
    productSalePrice,
    header,
    searchInput,
    noItemsText,
    horizontalLine,
    counterContainer,
    counter,
  } = styles;

  const renderQuantity = (quantity) => {
    const { productQuantityBlue, productQuantityRed } = styles;
    if (quantity < 10) {
      return <Text style={productQuantityRed}>Quantity: {quantity}</Text>;
    } else {
      return <Text style={productQuantityBlue}>Quantity: {quantity}</Text>;
    }
  };

  const filteredProductData = productData.filter(
    (item) =>
      item.code.includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScanButtonPress = () => {
    navigation.navigate('Scan');
  };

  const handleDecrement = (item) => {
    const itemQuantity = quantityMap[item.code] || 0;
    if (itemQuantity > 0) {
      const updatedQuantityMap = { ...quantityMap, [item.code]: itemQuantity - 1 };
      setQuantityMap(updatedQuantityMap);
    }
  };

  const handleIncrement = (item) => {
    const itemQuantity = quantityMap[item.code] || 0;
    const updatedQuantityMap = { ...quantityMap, [item.code]: itemQuantity + 1 };
    setQuantityMap(updatedQuantityMap);
  };

  const handleAddToList = (item) => {
    if(whID){
      const itemQuantity = quantityMap[item.code] || 0;

    const selectedItem = {
      code: item.code,
      description: item.description,
      saleprice: item.saleprice,
      quantity: itemQuantity,
    };

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO warehouse_items (code, description, saleprice, quantity, warehouse_id) VALUES (?, ?, ?, ?, ?)',
        [selectedItem.code, selectedItem.description, selectedItem.saleprice, selectedItem.quantity, whID],
        () => console.log('Item added to warehouse_items successfully'),
        (_, error) => console.log('Error inserting item into warehouse_items:', error)
      );
    });

    setList((prevList) => [...prevList, selectedItem]);

    const updatedQuantityMap = { ...quantityMap, [item.code]: 0 };
    setQuantityMap(updatedQuantityMap);
    setSecondHelper(secondHelper + 1);

    Alert.alert('Item Added', 'The item has been successfully added to the warehouse.');
    }else{
      const updatedQuantityMap = { ...quantityMap, [item.code]: 0 };
      setQuantityMap(updatedQuantityMap);
      Alert.alert('Please Select a Warehouse')
    }
  };
  

  const selectFile = async () => {
    try {
      const file = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: false,
      });
  
      if (file.type === 'success') {
        setSelectedFileUri(file.uri);
        const response = await fetch(file.uri);
        const data = await response.json();
  
        db.transaction((tx) => {
          tx.executeSql(
            'DELETE FROM products',
            [],
            () => {
              data.forEach((product) => {
                tx.executeSql(
                  'INSERT INTO products (code, description, saleprice, quantity) VALUES (?, ?, ?, ?)',
                  [product.code, product.description, product.saleprice, product.quantity],
                  () => console.log('Product inserted successfully'),
                  (_, error) => console.log('Error inserting product:', error)
                );
              });
            },
            (_, error) => console.log('Error deleting products:', error)
          );
        });
      }
    } catch (error) {
      console.log('Error selecting file:', error);
    }
  };


  const clearAllTables = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM selected_items',
        [],
        (_, result) => {
          console.log('Selected items table cleared.');
        },
        (_, error) => {
          console.log('Error clearing selected items table:', error);
        }
      );
  
      tx.executeSql(
        'DELETE FROM products',
        [],
        (_, result) => {
          console.log('Products table cleared.');
        },
        (_, error) => {
          console.log('Error clearing products table:', error);
        }
      );
  
      tx.executeSql(
        'DELETE FROM warehouses',
        [],
        (_, result) => {
          console.log('Warehouses table cleared.');
        },
        (_, error) => {
          console.log('Error clearing warehouses table:', error);
        }
      );
  
      tx.executeSql(
        'DELETE FROM warehouse_items',
        [],
        (_, result) => {
          console.log('Warehouse items table cleared.');
        },
        (_, error) => {
          console.log('Error clearing warehouse items table:', error);
        }
      );
    });
  };
  
  

  const unselectFile = () => {
    setSelectedFileUri(null);
    setProductData([]);
    setQuantityMap({});
    setSecondHelper(secondHelper+1)
    clearAllTables();
  };

  const renderItem = ({ item }) => {
    const itemQuantity = quantityMap[item.code] || 0;

    return (
      <View style={productItem}>
        <Text style={productCode}>Code: {item.code}</Text>
        <Text style={productDescription}>Item: {item.description}</Text>
        <Text style={productSalePrice}>Sale Price: {item.saleprice}</Text>
        {renderQuantity(item.quantity)}

        <View style={horizontalLine} />

        <View style={counterContainer}>
          <Button title="-" onPress={() => handleDecrement(item)} />
          <Text style={counter}>{itemQuantity}</Text>
          <Button title="+" onPress={() => handleIncrement(item)} />
        </View>
        <View style={addButtonContainer}>
          <Button
            title="Add to List"
            onPress={() => handleAddToList(item)}
            style={addButton}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={container}>
      <Text style={header}>All Items</Text>
      <View style={searchContainer}>
        <TextInput
          style={searchInput}
          placeholder="Search by code or description"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
        <Button title="Scan" style={scanButton} onPress={handleScanButtonPress} />
        {productData.length === 0 ? (
          <Button
            title="Select File"
            onPress={selectFile}
            style={scanButton}
          />
        ) : (
          <Button
            title="Unselect File"
            onPress={unselectFile}
            style={scanButton}
          />
        )}
      </View>
      {filteredProductData.length === 0 ? (
        <Text style={noItemsText}>No items found</Text>
      ) : (
        <FlatList
          data={filteredProductData}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  productItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 20,
    borderRadius: 8,
    elevation: 2,
  },
  productCode: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 17,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  productSalePrice: {
    fontSize: 16,
    color: 'green',
    marginBottom: 10,
  },
  productQuantityBlue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'blue',
  },
  productQuantityRed: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'red',
  },
  searchInput: {
    flex: 8,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  scanButton: {
    flex: 2,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  noItemsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
  },
  horizontalLine: {
    borderBottomWidth: 1,
    borderColor: 'gray',
    marginBottom: 10,
    marginTop: 20,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButtonContainer: {
    marginTop: 10,
    alignSelf: 'center',
    width: '50%',
  },
});
