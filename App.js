import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { useState } from 'react';
import Scan from './src/screens/Scan';
import ProductList from './src/screens/ProductList';
import MyList from './src/screens/MyList';
import WarehouseList from './src/screens/Inventory';
import WarehouseItemList from './src/screens/WarehouseItemList';
const Drawer = createDrawerNavigator();

function App() {
  const [list, setList] = useState([]);
  const [helper, setHelper] = useState(0);
  const [secondHelper, setSecondHelper] = useState(0);
  const [whID, setWHID] = useState();
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName='Display'>
      <Drawer.Screen name="Scan">
          {() => <Scan helper={helper} setHelper={setHelper} />}
        </Drawer.Screen>
        <Drawer.Screen name="Display">
          {({ route }) => (
            <ProductList
              secondHelper={secondHelper} setSecondHelper={setSecondHelper}
              sq={route.params?.searchQuery || ''}
              setList={setList} 
              setHelper={setHelper}
              helper={helper}
              whID={whID}
            />
          )}
        </Drawer.Screen>
        {/* <Drawer.Screen name="My List">
          {() => <MyList list={list} setList={setList} secondHelper={secondHelper} setSecondHelper={setSecondHelper} />}
        </Drawer.Screen> */}
        <Drawer.Screen name="Inventory">
          {() => <WarehouseList whID={whID} setWHID={setWHID} secondHelper={secondHelper} />}
        </Drawer.Screen>
        <Drawer.Screen
          name="Lists"
          component={WarehouseItemList}
          initialParams={secondHelper}
          options={{
            drawerItemStyle: { height: 0 }
          }}
          
        />
        </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default App;