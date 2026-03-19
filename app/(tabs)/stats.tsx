import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function Dropdown() {
  const [value, setValue] = useState("");

  return (
    <View style={styles.wrapper}>
      <Picker
        selectedValue={value}
        onValueChange={(itemValue) => setValue(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Lelystad" value="1" />
        <Picker.Item label="Venray" value="2" />
        <Picker.Item label="Zwolle" value="3" />
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    margin: 20,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    width: "20%"
  },
  picker: {
    height: 50,
    width: "100%",
    textAlign: "center",
    fontSize: 24,
    fontFamily: "Segeo UI"
  },
});