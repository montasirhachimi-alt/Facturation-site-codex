"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { persistCrmSalesRecord } from "@/platform/persistence";
import { FormSection } from "@/ui/forms/form-field";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import type { CompanyId } from "@/modules/crm/companies";
import { CompanyDialog } from "@/modules/crm/companies/ui/dialogs/company-dialog";
import type { CompanyFormState } from "@/modules/crm/companies/ui/hooks/use-companies-page";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, notifyCrmCompanyStoreUpdated } from "@/modules/crm/companies/ui/company-local-store";
import { ContactDialog } from "@/modules/crm/contacts/ui/dialogs/contact-dialog";
import type { ContactFormState } from "@/modules/crm/contacts/ui/hooks/use-company-contacts-workspace";
import { CRM_CONTACTS_USER_ID, CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService, notifyCrmContactStoreUpdated } from "@/modules/crm/contacts/ui/contact-local-store";
import { QuoteDialog } from "@/modules/sales/quotes/ui/quote-dialog";
import { InvoiceDialog } from "@/modules/sales/invoices/ui/invoice-dialog";
import { SalesOrderDialog, createEmptySalesOrderLine, type SalesOrderFormState } from "@/modules/sales/orders/ui";
import { SALES_ORDERS_USER_ID, SALES_ORDERS_WORKSPACE_ID, salesOrderService, notifySalesOrderStoreUpdated } from "@/modules/sales/orders";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, notifyProcurementStoreUpdated } from "@/modules/procurement";
import { hydrateInventoryPersistence, persistProcurementRecord, postProcurementGoodsReceipt, hydrateProductCatalogPersistence } from "@/platform/persistence";
import { inventoryLocalService } from "@/modules/inventory/inventory-local-store";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { productLocalService } from "@/modules/products/ui/product-local-store";
import { SupplierDialog, emptySupplierForm as emptyProcurementSupplierForm, type SupplierFormState } from "@/modules/procurement/ui/dialogs/supplier-dialog";
import { GoodsReceiptDialog, type GoodsReceiptFormState, PurchaseOrderDialog, type PurchaseOrderFormState } from "@/modules/procurement/ui/dialogs";
import { DEFAULT_PROCUREMENT_CURRENCY, PROCUREMENT_USER_ID } from "@/modules/procurement/procurement.constants";
import { createEmptyPurchaseOrderLine } from "@/modules/procurement/procurement.utils";
import { getCompanyPickerItems, subscribeToCrmPickerSources } from "@/ui/forms/entity-picker.crm-data";
import type { QuickCreateActionId } from "../action-registry";

const emptyCompanyForm: CompanyFormState = {
  legalName: "",
  displayName: "",
  industry: "unknown",
  website: "",
  email: "",
  phone: "",
  city: "",
  country: "Maroc",
  status: "lead",
  tags: "",
  notes: ""
};

const emptyContactForm: ContactFormState = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  department: "",
  email: "",
  mobilePhone: "",
  officePhone: "",
  preferredLanguage: "fr",
  timezone: "Africa/Casablanca",
  status: "active",
  isPrimaryContact: false,
  isDecisionMaker: false,
  linkedin: "",
  notes: "",
  tags: ""
};

const emptySupplierForm: SupplierFormState = {
  ...emptyProcurementSupplierForm
};

function createEmptyPurchaseOrderForm(): PurchaseOrderFormState {
  return {
    supplierId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    expectedDate: "",
    currency: DEFAULT_PROCUREMENT_CURRENCY,
    reference: "",
    notes: "",
    discountRate: 0,
    lines: [createEmptyPurchaseOrderLine("quick-po")]
  };
}

function createEmptyGoodsReceiptForm(): GoodsReceiptFormState {
  return {
    purchaseOrderId: "",
    warehouseId: "",
    receiptDate: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
    lines: []
  };
}

function createEmptySalesOrderForm(): SalesOrderFormState {
  return {
    companyId: "",
    contactId: "",
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: "",
    currency: "MAD",
    customerReference: "",
    internalReference: "",
    notes: "",
    discountRate: 0,
    lines: [createEmptySalesOrderLine("quick-so")]
  };
}

type QuickCreateDialogHostProps = {
  activeAction: QuickCreateActionId | null;
  onClose: () => void;
};

export function QuickCreateDialogHost({ activeAction, onClose }: QuickCreateDialogHostProps) {
  const router = useRouter();
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(emptyCompanyForm);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [purchaseOrderForm, setPurchaseOrderForm] = useState<PurchaseOrderFormState>(createEmptyPurchaseOrderForm);
  const [goodsReceiptForm, setGoodsReceiptForm] = useState<GoodsReceiptFormState>(createEmptyGoodsReceiptForm);
  const [salesOrderForm, setSalesOrderForm] = useState<SalesOrderFormState>(createEmptySalesOrderForm);
  const [contactCompanyId, setContactCompanyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pickerVersion, setPickerVersion] = useState(0);
  const liveCompanyPickerItems = useMemo(() => {
    void pickerVersion;
    return getCompanyPickerItems();
  }, [pickerVersion]);
  const closeAndReset = useCallback(() => {
    setCompanyForm(emptyCompanyForm);
    setContactForm(emptyContactForm);
    setContactCompanyId("");
    setSupplierForm(emptySupplierForm);
    setPurchaseOrderForm(createEmptyPurchaseOrderForm());
    setGoodsReceiptForm(createEmptyGoodsReceiptForm());
    setSalesOrderForm(createEmptySalesOrderForm());
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => subscribeToCrmPickerSources(() => setPickerVersion((value) => value + 1)), []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  function finishWithSuccess(message: string) {
    setCompanyForm(emptyCompanyForm);
    setContactForm(emptyContactForm);
    setContactCompanyId("");
    setSupplierForm(emptySupplierForm);
    setPurchaseOrderForm(createEmptyPurchaseOrderForm());
    setGoodsReceiptForm(createEmptyGoodsReceiptForm());
    setSalesOrderForm(createEmptySalesOrderForm());
    setError(null);
    setSuccessMessage(message);
    onClose();
  }

  async function submitCompany() {
    const snapshot = crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: true }).companies;
    const result = crmCompanyLocalService.createCompany({
      workspaceId: CRM_COMPANIES_WORKSPACE_ID,
      legalName: companyForm.legalName,
      displayName: companyForm.displayName,
      industry: companyForm.industry,
      website: companyForm.website,
      email: companyForm.email,
      phone: companyForm.phone,
      city: companyForm.city,
      country: companyForm.country,
      status: companyForm.status,
      tags: companyForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      notes: companyForm.notes,
      ownerId: CRM_COMPANIES_USER_ID,
      createdBy: CRM_COMPANIES_USER_ID
    });
    if (!result.company) {
      setError(result.validation.issues[0]?.message ?? "Impossible de créer la société.");
      return false;
    }
    try {
      await persistCrmSalesRecord("company", result.company);
    } catch {
      crmCompanyLocalService.replaceCompanies(snapshot);
      setError("La société n'a pas pu être enregistrée dans la base. Vérifiez la connexion puis réessayez.");
      return false;
    }
    notifyCrmCompanyStoreUpdated();
    finishWithSuccess("Société créée.");
    return true;
  }

  async function submitContact() {
    if (!contactCompanyId) {
      setError("Sélectionnez une société pour rattacher le contact.");
      return;
    }
    const snapshot = crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: true }).contacts;
    const result = crmContactLocalService.createContact({
      workspaceId: CRM_CONTACTS_WORKSPACE_ID,
      companyId: contactCompanyId as CompanyId,
      firstName: contactForm.firstName,
      lastName: contactForm.lastName,
      jobTitle: contactForm.jobTitle,
      department: contactForm.department,
      email: contactForm.email,
      mobilePhone: contactForm.mobilePhone,
      officePhone: contactForm.officePhone,
      preferredLanguage: contactForm.preferredLanguage,
      timezone: contactForm.timezone,
      status: contactForm.status,
      isPrimaryContact: contactForm.isPrimaryContact,
      isDecisionMaker: contactForm.isDecisionMaker,
      linkedin: contactForm.linkedin,
      notes: contactForm.notes,
      tags: contactForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      ownerId: CRM_CONTACTS_USER_ID,
      createdBy: CRM_CONTACTS_USER_ID
    });
    if (!result.contact) {
      setError(result.validation.issues[0]?.message ?? "Impossible de créer le contact.");
      return;
    }
    try {
      await persistCrmSalesRecord("contact", result.contact);
    } catch {
      crmContactLocalService.replaceContacts(snapshot);
      setError("Le contact n'a pas pu être enregistré dans la base. Vérifiez la connexion puis réessayez.");
      return;
    }
    notifyCrmContactStoreUpdated();
    finishWithSuccess("Contact enregistré.");
  }

  async function submitSupplier() {
    const snapshot = procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).suppliers;
    const result = procurementLocalService.createSupplier({ workspaceId: PROCUREMENT_WORKSPACE_ID, ...supplierForm });
    if (!result.supplier) {
      setError(result.error ?? "Impossible de créer le fournisseur.");
      return false;
    }
    try {
      await persistProcurementRecord("supplier", result.supplier);
    } catch {
      procurementLocalService.replaceSuppliers(snapshot);
      setError("Le fournisseur n'a pas pu être enregistré dans la base.");
      return false;
    }
    notifyProcurementStoreUpdated();
    finishWithSuccess("Fournisseur créé.");
    return true;
  }

  async function submitPurchaseOrder() {
    const supplier = procurementLocalService.getSupplier(purchaseOrderForm.supplierId as never, PROCUREMENT_WORKSPACE_ID);
    if (!supplier) {
      setError("Sélectionnez un fournisseur.");
      return false;
    }
    const snapshot = procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).purchaseOrders;
    const result = procurementLocalService.createPurchaseOrder({
      workspaceId: PROCUREMENT_WORKSPACE_ID,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      issueDate: new Date(purchaseOrderForm.issueDate).toISOString(),
      expectedDate: purchaseOrderForm.expectedDate ? new Date(purchaseOrderForm.expectedDate).toISOString() : undefined,
      currency: purchaseOrderForm.currency,
      reference: purchaseOrderForm.reference,
      notes: purchaseOrderForm.notes,
      discountRate: purchaseOrderForm.discountRate,
      lines: purchaseOrderForm.lines,
      ownerId: PROCUREMENT_USER_ID
    });
    if (!result.purchaseOrder) {
      setError(result.error ?? "Impossible de créer la commande fournisseur.");
      return false;
    }
    try {
      await persistProcurementRecord("purchaseOrder", result.purchaseOrder);
    } catch {
      procurementLocalService.replacePurchaseOrders(snapshot);
      setError("La commande fournisseur n'a pas pu être enregistrée dans la base.");
      return false;
    }
    notifyProcurementStoreUpdated();
    finishWithSuccess("Commande fournisseur créée.");
    router.push("/procurement/purchase-orders");
    return true;
  }

  async function submitGoodsReceipt() {
    const order = procurementLocalService.getPurchaseOrder(goodsReceiptForm.purchaseOrderId as never, PROCUREMENT_WORKSPACE_ID);
    if (!order) {
      setError("Sélectionnez une commande fournisseur.");
      return false;
    }
    const warehouse = inventoryLocalService.getSnapshot().warehouses.find((item) => item.id === goodsReceiptForm.warehouseId && item.active);
    if (!warehouse) {
      setError("Sélectionnez un entrepôt actif.");
      return false;
    }
    const receiptSnapshot = procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).goodsReceipts;
    const result = procurementLocalService.createGoodsReceipt({
      workspaceId: PROCUREMENT_WORKSPACE_ID,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      purchaseOrderId: order.id,
      purchaseOrderNumber: order.number,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      receiptDate: new Date(goodsReceiptForm.receiptDate).toISOString(),
      reference: goodsReceiptForm.reference,
      notes: goodsReceiptForm.notes,
      lines: goodsReceiptForm.lines,
      ownerId: PROCUREMENT_USER_ID
    });
    if (!result.goodsReceipt) {
      setError(result.error ?? "Impossible de créer la réception.");
      return false;
    }
    try {
      await postProcurementGoodsReceipt(result.goodsReceipt);
    } catch (saveError) {
      procurementLocalService.replaceGoodsReceipts(receiptSnapshot);
      setError(saveError instanceof Error ? saveError.message : "La réception n'a pas pu être postée.");
      return false;
    }
    finishWithSuccess("Réception postée.");
    router.push("/procurement/goods-receipts");
    return true;
  }

  async function submitSalesOrder() {
    const company = crmCompanyLocalService.getCompany(salesOrderForm.companyId as never, CRM_COMPANIES_WORKSPACE_ID);
    if (!company) {
      setError("Sélectionnez une société.");
      return false;
    }
    const contact = salesOrderForm.contactId ? crmContactLocalService.getContact(salesOrderForm.contactId as never, CRM_CONTACTS_WORKSPACE_ID) : undefined;
    const snapshot = salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: true }).orders;
    const result = salesOrderService.createOrder({
      workspaceId: SALES_ORDERS_WORKSPACE_ID,
      companyId: company.id,
      companyName: company.displayName,
      contactId: contact?.id,
      contactName: contact?.fullName,
      orderDate: new Date(salesOrderForm.orderDate).toISOString(),
      expectedDeliveryDate: salesOrderForm.expectedDeliveryDate ? new Date(salesOrderForm.expectedDeliveryDate).toISOString() : undefined,
      currency: salesOrderForm.currency,
      customerReference: salesOrderForm.customerReference,
      internalReference: salesOrderForm.internalReference,
      notes: salesOrderForm.notes,
      lines: salesOrderForm.lines,
      discountRate: salesOrderForm.discountRate,
      ownerId: SALES_ORDERS_USER_ID
    });
    if (!result.order) {
      setError(result.error ?? "Impossible de créer la commande client.");
      return false;
    }
    try {
      await persistCrmSalesRecord("salesOrder", result.order);
    } catch {
      salesOrderService.replaceOrders(snapshot);
      setError("La commande client n'a pas pu être enregistrée dans la base.");
      return false;
    }
    notifySalesOrderStoreUpdated();
    finishWithSuccess("Commande client créée.");
    router.push(`/sales/orders/${result.order.id}`);
    return true;
  }

  const toast = successMessage ? (
    <p
      role="status"
      className="fixed bottom-4 right-4 z-[90] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-[0_18px_45px_rgba(15,118,110,0.18)] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
    >
      {successMessage}
    </p>
  ) : null;

  if (activeAction === "quick-create.company") {
    return (
      <>
        {toast}
        <CompanyDialog
          error={error}
          form={companyForm}
          onChange={setCompanyForm}
          onClose={closeAndReset}
          onSubmit={submitCompany}
          open
        />
      </>
    );
  }

  if (activeAction === "quick-create.contact") {
    return (
      <>
        {toast}
        <ContactDialog
          editing={false}
          error={error}
          form={contactForm}
          onChange={setContactForm}
          onClose={closeAndReset}
          onSubmit={submitContact}
          open
          relationshipField={
            <FormSection title="Relation CRM" description="Chaque contact doit être rattaché à une société existante.">
              <SmartEntityPicker
                label="Société"
                items={liveCompanyPickerItems}
                value={liveCompanyPickerItems.find((item) => item.id === contactCompanyId)?.title ?? ""}
                onChange={({ item }) => setContactCompanyId(item?.relations?.companyId ?? "")}
                placeholder="Rechercher une société..."
              />
            </FormSection>
          }
        />
      </>
    );
  }

  if (activeAction === "quick-create.quote") {
    return (
      <QuoteDialog
        onClose={closeAndReset}
        onSubmit={(quote) => {
          finishWithSuccess("Devis créé.");
          router.push(`/sales/quotes/${quote.id}`);
        }}
        open
      />
    );
  }

  if (activeAction === "quick-create.invoice") {
    return (
      <InvoiceDialog
        onClose={closeAndReset}
        onSubmit={(invoice) => {
          finishWithSuccess("Facture créée.");
          router.push(`/sales/invoices/${invoice.id}`);
        }}
        open
      />
    );
  }

  if (activeAction === "quick-create.sales-order") {
    void hydrateProductCatalogPersistence();
    const companies = crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies;
    const contacts = crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: false }).contacts;
    const products = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
    return (
      <>
        {toast}
        <SalesOrderDialog
          companies={companies}
          contacts={contacts}
          error={error}
          form={salesOrderForm}
          onChange={setSalesOrderForm}
          onClose={closeAndReset}
          onSubmit={submitSalesOrder}
          open
          products={products}
        />
      </>
    );
  }

  if (activeAction === "quick-create.supplier") {
    return (
      <>
        {toast}
        <SupplierDialog
          editing={false}
          error={error}
          form={supplierForm}
          onChange={setSupplierForm}
          onClose={closeAndReset}
          onSubmit={submitSupplier}
          open
        />
      </>
    );
  }

  if (activeAction === "quick-create.purchase-order") {
    void hydrateProductCatalogPersistence();
    const suppliers = procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).suppliers;
    const products = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
    return (
      <>
        {toast}
        <PurchaseOrderDialog
          error={error}
          form={purchaseOrderForm}
          onChange={setPurchaseOrderForm}
          onClose={closeAndReset}
          onSubmit={submitPurchaseOrder}
          open
          products={products}
          suppliers={suppliers}
        />
      </>
    );
  }

  if (activeAction === "quick-create.goods-receipt") {
    void hydrateInventoryPersistence();
    const purchaseOrders = procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).purchaseOrders.filter((order) => order.status !== "received" && order.status !== "cancelled" && order.status !== "archived");
    const postedReceipts = procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, status: "posted", includeArchived: false }).goodsReceipts;
    const warehouses = inventoryLocalService.getSnapshot().warehouses.filter((warehouse) => warehouse.active);
    return (
      <>
        {toast}
        <GoodsReceiptDialog
          error={error}
          form={goodsReceiptForm}
          onChange={setGoodsReceiptForm}
          onClose={closeAndReset}
          onSubmit={submitGoodsReceipt}
          open
          postedReceipts={postedReceipts}
          purchaseOrders={purchaseOrders}
          warehouses={warehouses}
        />
      </>
    );
  }

  return toast;
}
