import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SIZES } from '../../config/theme';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { HEALTH_CATEGORIES } from '../../utils/healthTipsData';
import { addRecordSuccess, updateRecordSuccess } from '../../redux/recordsSlice';
import { db } from '../../config/firebase';

export default function AddEditRecordScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  // Check if we are in Edit Mode
  const editingRecord = route.params?.record || null;
  const isEditMode = !!editingRecord;

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Set default values in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      setTitle(editingRecord.title);
      setDescription(editingRecord.description);
      setCategory(editingRecord.category);
      setDate(editingRecord.date);
      setNotes(editingRecord.notes || '');
    } else {
      // Pre-fill today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [isEditMode, editingRecord]);

  const handleSave = async () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    
    // Simple date format validator (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date.trim() || !dateRegex.test(date)) {
      newErrors.date = 'Date must be in YYYY-MM-DD format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const recordData = {
      title: title.trim(),
      description: description.trim(),
      category,
      date: date.trim(),
      notes: notes.trim() || null,
      userId: user.uid,
    };

    try {
      const { ref, set } = require('firebase/database');

      let recordId = editingRecord?.id;
      if (!isEditMode) {
        recordId = 'rec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      }

      const docRef = ref(db, `records/${user.uid}/${recordId}`);
      await set(docRef, recordData);

      if (isEditMode) {
        dispatch(updateRecordSuccess({ id: recordId, ...recordData }));
      } else {
        dispatch(addRecordSuccess({ id: recordId, ...recordData }));
      }

      Toast.show({
        type: 'success',
        text1: isEditMode ? 'Record Updated' : 'Record Created',
        text2: `"${recordData.title}" saved successfully!`,
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <View style={[styles.headerContainer, { borderBottomColor: activeColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={activeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.text }]}>
          {isEditMode ? 'Edit Health Record' : 'Add Health Record'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Form Body */}
        <View style={[styles.formCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          
          <CustomInput
            label="Record Title"
            placeholder="e.g. Monthly Checkup, Blood Pressure check"
            value={title}
            onChangeText={(val) => {
              setTitle(val);
              setErrors((prev) => ({ ...prev, title: null }));
            }}
            error={errors.title}
            iconName="document-text-outline"
            theme={theme}
          />

          {/* Category Selector */}
          <View style={styles.dropdownContainer}>
            <Text style={[styles.label, { color: activeColors.textSecondary }]}>Health Category</Text>
            <View style={styles.categoriesGrid}>
              {HEALTH_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    {
                      borderColor: activeColors.border,
                      backgroundColor: category === cat ? activeColors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: category === cat ? '#FFFFFF' : activeColors.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <CustomInput
            label="Record Date (YYYY-MM-DD)"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={(val) => {
              setDate(val);
              setErrors((prev) => ({ ...prev, date: null }));
            }}
            error={errors.date}
            iconName="calendar-outline"
            theme={theme}
          />

          <CustomInput
            label="Description / Diagnostics"
            placeholder="Enter clinical symptoms, diagnosis results, or details of this medical event..."
            value={description}
            onChangeText={(val) => {
              setDescription(val);
              setErrors((prev) => ({ ...prev, description: null }));
            }}
            error={errors.description}
            multiline
            numberOfLines={4}
            iconName="medical-outline"
            theme={theme}
          />

          <CustomInput
            label="Doctor Notes & Reminders (Optional)"
            placeholder="Prescribed medicines, next dosage, doctor advice or scheduled follow-ups..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            iconName="people-outline"
            theme={theme}
          />

          <CustomButton
            title={isEditMode ? 'Update Record' : 'Save Health Record'}
            onPress={handleSave}
            loading={saving}
            theme={theme}
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 32, // placeholder to align title to center
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    padding: 20,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 24,
  },
  label: {
    ...FONTS.caption,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 16,
    width: '100%',
  },
});
