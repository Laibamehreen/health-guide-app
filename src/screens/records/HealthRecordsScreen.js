import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SIZES } from '../../config/theme';
import Card from '../../components/Card';
import CustomInput from '../../components/CustomInput';
import { HEALTH_CATEGORIES } from '../../utils/healthTipsData';
import { db } from '../../config/firebase';
import {
  recordsStart,
  setRecordsSuccess,
  deleteRecordSuccess,
  recordsFailure,
  setSearchQuery,
  setFilterCategory,
} from '../../redux/recordsSlice';

export default function HealthRecordsScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  const { records, loading, searchQuery, filterCategory } = useSelector((state) => state.records);
  const [refreshing, setRefreshing] = useState(false);

  // Categories list with 'All' prepended
  const filterCategories = ['All', ...HEALTH_CATEGORIES];

  const fetchRecords = async () => {
    dispatch(recordsStart());
    try {
      const { ref, get } = require('firebase/database');
      const recordsRef = ref(db, `records/${user.uid}`);
      const snapshot = await get(recordsRef);
      const firebaseRecords = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          firebaseRecords.push({ id: key, ...data[key] });
        });
      }
      firebaseRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      dispatch(setRecordsSuccess(firebaseRecords));
    } catch (err) {
      console.error(err);
      dispatch(recordsFailure(err.message));
      Toast.show({
        type: 'error',
        text1: 'Failed to load records',
        text2: err.message,
      });
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user?.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  };

  const handleDeleteRecord = (recordId, recordTitle) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete "${recordTitle}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { ref, set } = require('firebase/database');
              const docRef = ref(db, `records/${user.uid}/${recordId}`);
              await set(docRef, null);
              dispatch(deleteRecordSuccess(recordId));
              Toast.show({
                type: 'success',
                text1: 'Record Deleted',
                text2: 'Health record has been removed.',
              });
            } catch (err) {
              console.error(err);
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: 'Could not delete the selected record.',
              });
            }
          },
        },
      ]
    );
  };

  // Local filtering & search logic
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === 'All' || rec.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const renderRecordItem = ({ item }) => {
    return (
      <Card theme={theme} style={styles.recordCard}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <Ionicons name="medical-outline" size={14} color={activeColors.primary} style={styles.cardIcon} />
            <Text style={[styles.categoryText, { color: activeColors.primary }]}>{item.category}</Text>
          </View>
          <Text style={[styles.dateText, { color: activeColors.textMuted }]}>{item.date}</Text>
        </View>

        <Text style={[styles.recordTitle, { color: activeColors.text }]}>{item.title}</Text>
        <Text style={[styles.recordDesc, { color: activeColors.textSecondary }]}>{item.description}</Text>

        {item.notes ? (
          <View style={[styles.notesContainer, { backgroundColor: activeColors.background, borderColor: activeColors.border }]}>
            <Text style={[styles.notesLabel, { color: activeColors.textSecondary }]}>👨‍⚕️ Doctor's Notes:</Text>
            <Text style={[styles.notesContent, { color: activeColors.textSecondary }]}>{item.notes}</Text>
          </View>
        ) : null}

        <View style={[styles.cardActions, { borderTopColor: activeColors.border }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddEditRecord', { record: item })}
          >
            <Ionicons name="create-outline" size={18} color={activeColors.primary} />
            <Text style={[styles.actionText, { color: activeColors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteRecord(item.id, item.title)}
          >
            <Ionicons name="trash-outline" size={18} color={activeColors.error} />
            <Text style={[styles.actionText, { color: activeColors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
      {/* Title Header */}
      <View style={[styles.headerContainer, { borderBottomColor: activeColors.border }]}>
        <Text style={[styles.headerTitle, { color: activeColors.text }]}>Health Records</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: activeColors.primary }]}
          onPress={() => navigation.navigate('AddEditRecord')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <CustomInput
          placeholder="Search records by title, notes..."
          value={searchQuery}
          onChangeText={(val) => dispatch(setSearchQuery(val))}
          iconName="search-outline"
          theme={theme}
          style={styles.searchBar}
        />
      </View>

      {/* Category Horizontal Filter Pills */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterCategories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = filterCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  {
                    borderColor: activeColors.border,
                    backgroundColor: isSelected ? activeColors.primary : activeColors.surface,
                  },
                ]}
                onPress={() => dispatch(setFilterCategory(item))}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isSelected ? '#FFFFFF' : activeColors.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.filterListContent}
        />
      </View>

      {/* Health Records List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderRecordItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeColors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={activeColors.textMuted} />
            <Text style={[styles.emptyTitle, { color: activeColors.text }]}>No Health Records Found</Text>
            <Text style={[styles.emptySubtitle, { color: activeColors.textMuted }]}>
              {searchQuery || filterCategory !== 'All'
                ? 'Try clearing your filters or changing your search criteria.'
                : 'Keep your health details stored in one place. Add your first medical record now!'}
            </Text>
            {searchQuery || filterCategory !== 'All' ? (
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: activeColors.primary + '15' }]}
                onPress={() => {
                  dispatch(setSearchQuery(''));
                  dispatch(setFilterCategory('All'));
                }}
              >
                <Text style={[styles.resetBtnText, { color: activeColors.primary }]}>Reset Filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    marginBottom: 0,
  },
  filterSection: {
    paddingVertical: 10,
  },
  filterListContent: {
    paddingHorizontal: 12,
  },
  filterPill: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  recordCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    ...FONTS.caption,
  },
  recordTitle: {
    ...FONTS.h3,
    fontWeight: '700',
    marginBottom: 6,
  },
  recordDesc: {
    ...FONTS.body2,
    lineHeight: 18,
    marginBottom: 12,
  },
  notesContainer: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 11,
    lineHeight: 15,
  },
  cardActions: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...FONTS.h3,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...FONTS.body2,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
