import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts if needed, built-in fonts are Helvetica, Times-Roman, Courier
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E06B10',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 10,
    color: '#666',
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  referenceNumber: {
    fontSize: 12,
    color: '#666',
  },
  customerSection: {
    marginBottom: 30,
  },
  customerLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  customerEmail: {
    marginTop: 2,
    color: '#555',
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  colMaterial: { width: '40%' },
  colQty: { width: '20%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsTable: {
    width: '40%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalLabel: {
    color: '#666',
  },
  totalValue: {
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 5,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  grandTotalLabel: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  grandTotalValue: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#E06B10',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
});

export const QuotePDF = ({ quote }: { quote: any }) => {
  const dateStr = new Date().toLocaleDateString();
  const expiresStr = quote.expiresAt 
    ? new Date(quote.expiresAt).toLocaleDateString()
    : new Date(Date.now() + 30 * 86400000).toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>BERMONT MATERIALS</Text>
            <Text style={styles.companyDetails}>37390 Bermont Rd</Text>
            <Text style={styles.companyDetails}>Punta Gorda, FL 33982</Text>
            <Text style={styles.companyDetails}>(866) 367-9557</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.referenceNumber}>#{quote.referenceNumber}</Text>
            <Text style={{ marginTop: 10, color: '#666' }}>Date: {dateStr}</Text>
            <Text style={{ color: '#666' }}>Valid Until: {expiresStr}</Text>
          </View>
        </View>

        <View style={styles.customerSection}>
          <Text style={styles.customerLabel}>Prepared For</Text>
          <Text style={styles.customerName}>{quote.customerName || 'Customer'}</Text>
          {quote.customerEmail && <Text style={styles.customerEmail}>{quote.customerEmail}</Text>}
          {quote.customerPhone && <Text style={styles.customerEmail}>{quote.customerPhone}</Text>}
          
          <View style={{ marginTop: 10 }}>
            <Text style={styles.customerLabel}>Fulfillment</Text>
            <Text>{quote.deliveryType === 'delivery' ? 'Delivery' : 'Pickup at ' + (quote.siteLocation === 'clarion' ? 'Clarion' : 'Alico')}</Text>
            {quote.deliveryAddress && <Text>{quote.deliveryAddress}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colMaterial, styles.tableHeaderCell]}>Material</Text>
            <Text style={[styles.colQty, styles.tableHeaderCell]}>Quantity</Text>
            <Text style={[styles.colPrice, styles.tableHeaderCell]}>Unit Price</Text>
            <Text style={[styles.colTotal, styles.tableHeaderCell]}>Amount</Text>
          </View>
          
          {quote.lineItems?.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colMaterial}>{item.materialName}</Text>
              <Text style={styles.colQty}>{Number(item.quantity)} {item.unit}</Text>
              <Text style={styles.colPrice}>${Number(item.unitPrice).toFixed(2)}</Text>
              <Text style={styles.colTotal}>${Number(item.total).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${Number(quote.subtotal || 0).toFixed(2)}</Text>
            </View>
            {Number(quote.deliveryFee) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>Delivery Fee</Text>
                <Text style={styles.totalValue}>${Number(quote.deliveryFee).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Tax (7%)</Text>
              <Text style={styles.totalValue}>${Number(quote.taxAmount || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${Number(quote.total || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for choosing Bermont Materials!</Text>
          <Text>If you have any questions about this quote, please contact our team.</Text>
        </View>
      </Page>
    </Document>
  );
};
