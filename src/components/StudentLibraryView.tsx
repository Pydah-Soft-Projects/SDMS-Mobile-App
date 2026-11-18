import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import {
  BookOpen,
  Search,
  X,
  MapPin,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react-native';

interface BookItem {
  _id?: string;
  id?: string;
  title: string;
  author: string;
  category?: string;
  shelf?: string;
  total?: number;
  available?: number;
  available_copies?: number;
  publisher?: string;
  edition?: string;
  accession?: string;
  barcode?: string;
  isbn?: string;
}

interface StudentLibraryViewProps {
  data: any;
  onRefresh?: () => void;
}

const CATEGORY_COLORS = [
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  { bg: '#F3E8FF', text: '#7C3AED', border: '#E9D5FF' },
  { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' },
];

function getCategoryColor(name?: string) {
  if (!name) return CATEGORY_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

export default function StudentLibraryView({ data }: StudentLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  // Normalize books list from raw data
  const books: BookItem[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.books)) return data.books;
    if (data.data && Array.isArray(data.data.books)) return data.data.books;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  // Derive distinct categories list
  const categoriesList = useMemo(() => {
    const rawCategories: any[] = data?.categories || [];
    if (rawCategories.length > 0) {
      return rawCategories.map((c) => (typeof c === 'string' ? c : c.name || '')).filter(Boolean);
    }
    const catSet = new Set<string>();
    books.forEach((b) => {
      if (b.category && b.category.trim()) catSet.add(b.category.trim());
    });
    return Array.from(catSet);
  }, [data, books]);

  // Filtered books (by category & search query)
  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
      // 1. Category filter
      if (selectedCategory !== 'all') {
        const bookCat = (book.category || '').toLowerCase();
        if (bookCat !== selectedCategory.toLowerCase()) return false;
      }

      // 2. Search query filter
      if (query) {
        const matchTitle = (book.title || '').toLowerCase().includes(query);
        const matchAuthor = (book.author || '').toLowerCase().includes(query);
        const matchCategory = (book.category || '').toLowerCase().includes(query);
        const matchShelf = (book.shelf || '').toLowerCase().includes(query);
        const matchBarcode = (book.barcode || '').toLowerCase().includes(query);
        const matchAccession = (book.accession || '').toLowerCase().includes(query);
        const matchIsbn = (book.isbn || '').toLowerCase().includes(query);
        return (
          matchTitle ||
          matchAuthor ||
          matchCategory ||
          matchShelf ||
          matchBarcode ||
          matchAccession ||
          matchIsbn
        );
      }

      return true;
    });
  }, [books, searchQuery, selectedCategory]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const isConnected = data?.isConnected !== false;

  return (
    <View style={styles.container}>
      {/* Database Setup Notice (only if disconnected) */}
      {!isConnected && (
        <View style={styles.noticeCard}>
          <AlertCircle size={18} color="#D97706" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Library Connection In Progress</Text>
            <Text style={styles.noticeSub}>
              The campus library database (LIBRARY_MONGO_URI) is being synced. Your catalog will
              update here automatically.
            </Text>
          </View>
        </View>
      )}

      {/* 1. Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, author, barcode, shelf..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8} style={styles.clearBtn}>
            <X size={15} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Category Pills Filter (Horizontal Scroll) */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === 'all' && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === 'all' && styles.categoryPillTextActive,
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>

          {categoriesList.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(isSelected ? 'all' : cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {(searchQuery.trim().length > 0 || selectedCategory !== 'all') && (
          <View style={styles.resetRow}>
            <Text style={styles.resultsCountText}>
              Showing {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
            </Text>
            <TouchableOpacity onPress={resetFilters} hitSlop={6}>
              <Text style={styles.resetFilterText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 3. Book List Cards */}
      {filteredBooks.length > 0 ? (
        <View style={styles.bookList}>
          {filteredBooks.map((book, idx) => {
            const catColors = getCategoryColor(book.category);
            const avail = book.available ?? book.available_copies ?? 0;
            const total = book.total ?? (avail > 0 ? avail : 1);
            const inStock = avail > 0;
            const percent = total > 0 ? Math.min(100, Math.round((avail / total) * 100)) : 0;

            return (
              <TouchableOpacity
                key={book._id || book.id || book.accession || idx}
                style={styles.bookCard}
                onPress={() => setSelectedBook(book)}
                activeOpacity={0.85}
              >
                {/* Header: Category Badge + Shelf location */}
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: catColors.bg,
                        borderColor: catColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.categoryBadgeText, { color: catColors.text }]}>
                      {book.category || 'General'}
                    </Text>
                  </View>

                  <View style={styles.shelfBadge}>
                    <MapPin size={11} color="#64748B" />
                    <Text style={styles.shelfText} numberOfLines={1}>
                      {book.shelf || 'Central Stack'}
                    </Text>
                  </View>
                </View>

                {/* Title & Author */}
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  by <Text style={styles.authorBold}>{book.author || 'Unknown'}</Text>
                </Text>

                {/* Metadata Row: Publisher, Edition, Accession */}
                <View style={styles.metaRow}>
                  {book.publisher ? (
                    <View style={styles.metaChip}>
                      <Building2 size={11} color="#64748B" />
                      <Text style={styles.metaChipText} numberOfLines={1}>
                        {book.publisher}
                      </Text>
                    </View>
                  ) : null}

                  {book.accession ? (
                    <View style={styles.metaChip}>
                      <Barcode size={11} color="#64748B" />
                      <Text style={styles.metaChipText} numberOfLines={1}>
                        Acc: {book.accession}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Stock Progress & Badge */}
                <View style={styles.stockFooter}>
                  <View style={styles.stockBarBg}>
                    <View
                      style={[
                        styles.stockBarFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: inStock ? '#16A34A' : '#DC2626',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.stockLabelRow}>
                    <View
                      style={[
                        styles.availabilityPill,
                        { backgroundColor: inStock ? '#ECFDF5' : '#FEE2E2' },
                      ]}
                    >
                      {inStock ? (
                        <CheckCircle2 size={11} color="#15803D" />
                      ) : (
                        <AlertCircle size={11} color="#DC2626" />
                      )}
                      <Text
                        style={[
                          styles.availabilityText,
                          { color: inStock ? '#15803D' : '#DC2626' },
                        ]}
                      >
                        {inStock ? `${avail} of ${total} Copies Available` : 'All Copies Issued'}
                      </Text>
                    </View>

                    <Text style={styles.tapDetailsText}>Tap for details ›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Empty / No Matches State */
        <View style={styles.emptyCard}>
          <BookOpen size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>
            {searchQuery || selectedCategory !== 'all'
              ? 'No Matching Books Found'
              : 'Library Catalog Empty'}
          </Text>
          <Text style={styles.emptySub}>
            {searchQuery || selectedCategory !== 'all'
              ? `No volumes matched "${searchQuery || selectedCategory}". Try searching with another keyword.`
              : 'No volumes found in the Central Library database. Please check back later.'}
          </Text>
          {(searchQuery.trim().length > 0 || selectedCategory !== 'all') && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={resetFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>Clear Search & Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 4. Book Details Modal */}
      <Modal
        visible={!!selectedBook}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBook(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedBook(null)}
              hitSlop={8}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            {selectedBook && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderBox}>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: getCategoryColor(selectedBook.category).bg,
                        borderColor: getCategoryColor(selectedBook.category).border,
                        alignSelf: 'flex-start',
                        marginBottom: 6,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: getCategoryColor(selectedBook.category).text },
                      ]}
                    >
                      {selectedBook.category || 'General'}
                    </Text>
                  </View>

                  <Text style={styles.modalBookTitle}>{selectedBook.title}</Text>
                  <Text style={styles.modalBookAuthor}>
                    by <Text style={{ fontWeight: '800', color: '#1E293B' }}>{selectedBook.author}</Text>
                  </Text>
                </View>

                {/* Availability Callout */}
                <View
                  style={[
                    styles.modalStockCallout,
                    {
                      backgroundColor:
                        (selectedBook.available ?? 0) > 0 ? '#ECFDF5' : '#FEE2E2',
                      borderColor:
                        (selectedBook.available ?? 0) > 0 ? '#A7F3D0' : '#FECACA',
                    },
                  ]}
                >
                  {(selectedBook.available ?? 0) > 0 ? (
                    <CheckCircle2 size={16} color="#059669" />
                  ) : (
                    <AlertCircle size={16} color="#DC2626" />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.modalStockTitle,
                        {
                          color: (selectedBook.available ?? 0) > 0 ? '#065F46' : '#991B1B',
                        },
                      ]}
                    >
                      {(selectedBook.available ?? 0) > 0
                        ? `${selectedBook.available} of ${selectedBook.total || selectedBook.available} Available in Library`
                        : 'Currently Checked Out (0 Available)'}
                    </Text>
                    <Text
                      style={[
                        styles.modalStockSub,
                        {
                          color: (selectedBook.available ?? 0) > 0 ? '#047857' : '#B91C1C',
                        },
                      ]}
                    >
                      Locate at {selectedBook.shelf || 'Central Library Stacks'}
                    </Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Shelf Location</Text>
                    <Text style={styles.detailItemVal}>{selectedBook.shelf || 'Central Stack'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Accession Number</Text>
                    <Text style={styles.detailItemVal}>{selectedBook.accession || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Barcode</Text>
                    <Text style={styles.detailItemVal}>{selectedBook.barcode || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>ISBN</Text>
                    <Text style={styles.detailItemVal}>{selectedBook.isbn || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Publisher</Text>
                    <Text style={styles.detailItemVal}>
                      {selectedBook.publisher || 'Institutional Press'}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Edition</Text>
                    <Text style={styles.detailItemVal}>
                      {selectedBook.edition || 'Standard Edition'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setSelectedBook(null)}
                >
                  <Text style={styles.modalDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
  },
  noticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92400E',
  },
  noticeSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 4,
  },
  filterSection: {
    gap: 6,
  },
  categoryScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  categoryPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 2,
  },
  resultsCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  resetFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  bookList: {
    gap: 10,
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  shelfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  shelfText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  bookTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 19,
    marginTop: 2,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#64748B',
  },
  authorBold: {
    color: '#334155',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaChipText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  stockFooter: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  stockBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  availabilityText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  tapDetailsText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 6,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    maxHeight: '80%',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    zIndex: 10,
  },
  modalHeaderBox: {
    paddingRight: 32,
    marginBottom: 12,
  },
  modalBookTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 22,
  },
  modalBookAuthor: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
  },
  modalStockCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  modalStockTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalStockSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 8,
  },
  detailItemLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  detailItemVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  modalDoneBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
