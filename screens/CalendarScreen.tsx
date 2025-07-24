import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

// カレンダー画面コンポーネント
function CalendarScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>カレンダー画面</Text>
      <Button
        title="メイン画面へ"
        onPress={() => navigation.navigate('Main')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default CalendarScreen; // CalendarScreen をエクスポート