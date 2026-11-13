import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSettings } from "@getpaseo/plugin/client";
import { preferences, DEFAULT_KEY_FILE } from "../shared/settings";

export function SettingsScreen() {
  const settings = useSettings(preferences);
  const [path, setPath] = useState(DEFAULT_KEY_FILE);
  const [saved, setSaved] = useState(false);
  const current =
    settings.status === "ready" ? settings.values.keyFile : undefined;
  useEffect(() => {
    if (current !== undefined) setPath(current);
  }, [current]);
  if (settings.status !== "ready")
    return (
      <Text>
        {settings.status === "loading" ? "Loading settings…" : settings.error}
      </Text>
    );
  const validation = preferences.schema.safeParse({ keyFile: path });
  return (
    <View style={{ padding: 24, gap: 16 }}>
      <Text style={{ color: "#ddd", fontSize: 20 }}>API key file</Text>
      <Text style={{ color: "#aaa" }}>
        Path on the machine running the Paseo daemon. The file contains only
        your Anthropic API key. ~/ uses that machine’s home directory.
      </Text>
      <TextInput
        accessibilityLabel="API key file path"
        value={path}
        onChangeText={(value) => {
          setPath(value);
          setSaved(false);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          color: "#ddd",
          borderColor: "#777",
          borderWidth: 1,
          padding: 12,
          borderRadius: 6,
        }}
      />
      {!validation.success ? (
        <Text style={{ color: "#ffc96b" }}>
          {validation.error.issues[0].message}
        </Text>
      ) : null}
      {settings.saveError ? (
        <Text style={{ color: "#ffc96b" }}>{settings.saveError}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={settings.saving || !validation.success}
        onPress={async () => {
          if (validation.success)
            setSaved(await settings.save(validation.data, settings.revision));
        }}
        style={{
          padding: 12,
          alignSelf: "flex-start",
          borderWidth: 1,
          borderColor: "#87d0a1",
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "#ddd" }}>
          {settings.saving ? "Saving…" : "Save path"}
        </Text>
      </Pressable>
      {saved ? (
        <Text style={{ color: "#87d0a1" }}>
          Saved. The next API session launch or authentication switch will read
          this file.
        </Text>
      ) : null}
    </View>
  );
}
