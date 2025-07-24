import React, { useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';

// カレンダー画面コンポーネント
function CalendarScreen({ navigation, selectedDate, setSelectedDate, currentChild, setCurrentChildId, dummyChildren }: any) {
    // カレンダーで選択された日付を管理するローカルstate
    // initialDate は selectedDate (App.tsxから渡される日付) を使用
    const [currentCalendarSelectedDate, setCurrentCalendarSelectedDate] = useState(
        selectedDate.toISOString().split('T')[0] // 'YYYY-MM-DD' 形式に変換
    );

    // 日付が選択されたときのハンドラ
    const onDayPress = (day: any) => {
        setCurrentCalendarSelectedDate(day.dateString); // カレンダーの選択を更新
        setSelectedDate(new Date(day.dateString)); // App.tsx の selectedDate も更新
        navigation.navigate('Main'); // メイン画面に戻る
    };

    return (
    <View style={styles.container}>
        {/* 現在のこどもの名前を表示 */}
        {currentChild && (
            <Text style={styles.childName}>
                {currentChild.name} のカレンダー
            </Text>
        )}

        {/* ★追加：次のこどもへ切り替えるボタン */}
        <Button
            title="次のこどもへ"
            onPress={() => {
            setCurrentChildId(); // App.tsx から渡された関数を呼び出す
            }}
        />

        <Text style={styles.title}>カレンダー画面</Text>
        <Calendar
            // 現在の月に表示する日付
            current={selectedDate.toISOString().split('T')[0]} // App.tsx から渡された日付を使用
            // 日付が選択されたときに呼び出される関数
            onDayPress={onDayPress}
            // 選択された日付をハイライト表示
            markedDates={{
                [currentCalendarSelectedDate]: {
                    selected: true,
                    marked: true,
                },
            }}
            // カレンダーのスタイル設定（任意）
            theme={{
                todayTextColor: '#00adf5',
                selectedDayBackgroundColor: '#00adf5',
            selectedDayTextColor: '#ffffff',
            }}
      />
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
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default CalendarScreen; // CalendarScreen をエクスポート