/**
 * @format
 */
import 'reflect-metadata';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {CacheFactory, LRUStrategy} from '@timp4w/react-native-async-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lruStrategy = new LRUStrategy();
lruStrategy.setMaxEntries(5000);

CacheFactory.setNamespace('@MyAppCache')
  .setBackend(AsyncStorage)
  .attachStrategy(lruStrategy)
  .create();

AppRegistry.registerComponent(appName, () => App);
