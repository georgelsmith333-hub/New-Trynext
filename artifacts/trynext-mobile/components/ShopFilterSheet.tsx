import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { cleanPriceInput, countActiveFilters, EMPTY_SHOP_FILTERS, type ShopFilters } from "@/lib/shopFilters";

interface Props {
  visible: boolean;
  value: ShopFilters;
  onApply: (next: ShopFilters) => void;
  onClose: () => void;
}

/** Bottom sheet for shop filters. Edits a draft; nothing changes until "Show results". */
export function ShopFilterSheet({ visible, value, onApply, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<ShopFilters>(value);

  // Start from the applied filters every time the sheet opens.
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const draftCount = countActiveFilters(draft);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close filters"
      />
      <View
        style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
        accessibilityViewIsModal
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]} accessibilityRole="header">Filters</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {draftCount ? `${draftCount} filter${draftCount === 1 ? "" : "s"} selected` : "Narrow the results"}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close filters">
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Price (৳)</Text>
        <View style={styles.priceRow}>
          <TextInput
            style={[styles.priceInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
            placeholder="Min"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            value={draft.minPrice}
            onChangeText={(t) => setDraft((d) => ({ ...d, minPrice: cleanPriceInput(t) }))}
            accessibilityLabel="Minimum price in taka"
            maxLength={7}
          />
          <Text style={{ color: colors.mutedForeground }}>to</Text>
          <TextInput
            style={[styles.priceInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
            placeholder="Max"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            value={draft.maxPrice}
            onChangeText={(t) => setDraft((d) => ({ ...d, maxPrice: cleanPriceInput(t) }))}
            accessibilityLabel="Maximum price in taka"
            maxLength={7}
          />
        </View>

        <View style={[styles.switchRow, { borderColor: colors.border }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.label, { color: colors.foreground, marginTop: 0 }]}>Customizable only</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>Products you can design with your own artwork</Text>
          </View>
          <Switch
            value={draft.customizableOnly}
            onValueChange={(v) => setDraft((d) => ({ ...d, customizableOnly: v }))}
            trackColor={{ true: colors.primary }}
            accessibilityLabel="Show customizable products only"
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => setDraft(EMPTY_SHOP_FILTERS)}
            style={[styles.resetBtn, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Reset all filters"
          >
            <Text style={[styles.resetText, { color: colors.foreground }]}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={() => onApply(draft)}
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Show results"
          >
            <Text style={styles.applyText}>Show results</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 18, gap: 12 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  sub: { fontSize: 12, marginTop: 2 },
  label: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_600SemiBold", marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  priceInput: { flex: 1, minWidth: 0, height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  switchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, marginTop: 4 },
  actions: { flexDirection: "row", gap: 12, marginTop: 6 },
  resetBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  resetText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  applyBtn: { flex: 2, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  applyText: { color: "#fff", fontSize: 15, fontWeight: "800", fontFamily: "Inter_700Bold" },
});
