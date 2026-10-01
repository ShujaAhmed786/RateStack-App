import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#09090b',
    color: '#f4f4f5',
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 20,
    marginBottom: 25,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10b981',
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#ffffff',
  },
  metaText: {
    color: '#a1a1aa',
    fontSize: 9,
    marginTop: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    fontWeight: 'bold',
    color: '#a1a1aa',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colAmount: { flex: 2, textAlign: 'right' },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalBox: {
    width: 200,
    padding: 12,
    backgroundColor: '#18181b',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
    paddingTop: 6,
    marginTop: 4,
    fontWeight: 'bold',
    color: '#10b981',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#52525b',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 10,
  },
});

interface InvoiceProps {
  invoiceNumber: string;
  issueDate: string;
  client: {
    name: string;
    companyName?: string | null;
    email: string;
  };
  contractTitle: string;
  milestoneTitle: string;
  milestoneDescription?: string | null;
  amount: number;
  currency: string;
  paidAt?: string | null;
}

export const MilestoneInvoiceDoc: React.FC<InvoiceProps> = ({
  invoiceNumber,
  issueDate,
  client,
  contractTitle,
  milestoneTitle,
  milestoneDescription,
  amount,
  currency,
  paidAt,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>RateStack</Text>
          <Text style={styles.metaText}>Automated Milestone Disbursement</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>{paidAt ? 'PAYMENT RECEIPT' : 'INVOICE'}</Text>
          <Text style={styles.metaText}>Ref: #{invoiceNumber}</Text>
          <Text style={styles.metaText}>Date: {issueDate}</Text>
          {paidAt && (
            <Text style={[styles.metaText, { color: '#10b981', fontWeight: 'bold' }]}>
              STATUS: PAID
            </Text>
          )}
        </View>
      </View>

      {/* Bill To */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill To</Text>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff' }}>{client.name}</Text>
        {client.companyName && <Text style={styles.metaText}>{client.companyName}</Text>}
        <Text style={styles.metaText}>{client.email}</Text>
      </View>

      {/* Project Context */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Agreement</Text>
        <Text style={{ fontSize: 11, color: '#e4e4e7' }}>{contractTitle}</Text>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Milestone Deliverable</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colAmount}>Amount ({currency})</Text>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.colDesc}>
            <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>{milestoneTitle}</Text>
            {milestoneDescription && (
              <Text style={[styles.metaText, { marginTop: 2 }]}>{milestoneDescription}</Text>
            )}
          </View>
          <Text style={styles.colQty}>1</Text>
          <Text style={styles.colAmount}>{amount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Total Box */}
      <View style={styles.totalContainer}>
        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.metaText}>Subtotal:</Text>
            <Text>{amount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.metaText}>Tax / Escrow Fee:</Text>
            <Text>0.00</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text>Total Paid:</Text>
            <Text>
              {currency} {amount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>
          This document was electronically generated and verified by RateStack Escrow Engine.
        </Text>
      </View>
    </Page>
  </Document>
);