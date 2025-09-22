import type { InventoryItem, User, ItemUnit, StockTransaction, StockTransactionType, IssueRequest, IssueRequestStatus, Supplier, Asset, AssetStatus, AssetLocationType } from '../types';
import { logAuditEvent } from './auditService';
import { getClasses } from './schoolService';
import { listTeachers } from './academicsService';

// --- MOCK DATA STORE ---
let MOCK_INVENTORY_ITEMS: InventoryItem[] = [
    { id: 'item-1', name: 'Laptop, 14"', sku: 'LPTP-14-G10', unit: 'Pcs', category: 'IT Equipment', reorderLevel: 5, reorderQty: 10, location: 'IT Store', trackAsset: true, photoUrl: 'https://placehold.co/100x100/EBF4FF/7F8A9A?text=Laptop', active: true },
    { id: 'item-2', name: 'Projector, Ceiling Mount', sku: 'PROJ-CM-2K', unit: 'Pcs', category: 'AV Equipment', reorderLevel: 2, reorderQty: 5, location: 'AV Store', trackAsset: true, active: true },
    { id: 'item-3', name: 'Whiteboard Markers, Black', sku: 'STAT-MRK-BLK', unit: 'Box', category: 'Stationery', reorderLevel: 20, reorderQty: 50, location: 'Main Store', trackAsset: false, photoUrl: 'https://placehold.co/100x100/EBF4FF/7F8A9A?text=Markers', active: true },
    { id: 'item-4', name: 'Textbook: Physics Grade 10', sku: 'BOOK-PHY-G10', unit: 'Pcs', category: 'Books', reorderLevel: 10, reorderQty: 30, location: 'Library', trackAsset: false, active: true },
    { id: 'item-5', name: 'Disinfectant Wipes', sku: 'CLEAN-WIPE-D', unit: 'Pcs', category: 'Cleaning Supplies', reorderLevel: 50, reorderQty: 100, location: 'Janitor Closet', trackAsset: false, active: false },
];

let MOCK_SUPPLIERS: Supplier[] = [
    { id: 'sup-1', name: 'Office Supplies Inc.', contactPerson: 'John Doe', phone: '555-1234', email: 'sales@officesupplies.com', active: true },
    { id: 'sup-2', name: 'Tech Corp', contactPerson: 'Jane Smith', phone: '555-5678', email: 'jane.s@techcorp.com', active: true },
    { id: 'sup-3', name: 'Cleaning Solutions Ltd', contactPerson: 'Mike Ross', phone: '555-9999', email: 'mike@cleaning.com', active: false },
];

let MOCK_STOCK_TRANSACTIONS: StockTransaction[] = [
    { id: 'txn-1', itemId: 'item-3', type: 'IN', quantity: 100, unitCost: 10.50, supplierId: 'sup-1', ref: 'PO-12345', createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), actorId: 'user-evelyn-reed' },
    { id: 'txn-2', itemId: 'item-3', type: 'OUT', quantity: -5, toEntityType: 'Teacher', toEntityId: 't-1', ref: 'REQ-001', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), actorId: 'user-evelyn-reed' },
    { id: 'txn-3', itemId: 'item-3', type: 'OUT', quantity: -5, toEntityType: 'Teacher', toEntityId: 't-2', ref: 'REQ-002', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), actorId: 'user-evelyn-reed' },
    { id: 'txn-4', itemId: 'item-1', type: 'IN', quantity: 20, unitCost: 899.99, supplierId: 'sup-2', ref: 'PO-12300', createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), actorId: 'user-evelyn-reed' },
    { id: 'txn-5', itemId: 'item-1', type: 'OUT', quantity: -15, toEntityType: 'Class', toEntityId: 'c4', ref: 'DEP-IT-01', createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), actorId: 'user-evelyn-reed' },
    { id: 'txn-6', itemId: 'item-3', type: 'ADJUST', quantity: -1, reason: 'Damaged in storage', createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), actorId: 'user-evelyn-reed' },
];

let MOCK_ISSUE_REQUESTS: IssueRequest[] = [
    { id: 'req-1', itemId: 'item-3', quantity: 2, requesterId: 't-1', status: 'Pending', requestedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), notes: 'For Form 1 classroom' },
    { id: 'req-2', itemId: 'item-1', quantity: 1, requesterId: 't-2', status: 'Approved', requestedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), approvedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), approverId: 'user-evelyn-reed' },
];

let MOCK_ASSETS: Asset[] = [
    { id: 'ASSET-00001', itemId: 'item-1', serialNumber: 'SN-A1B2C3D4', status: 'Assigned', assignedToType: 'Teacher', assignedToId: 't-1', assignedToName: 'Mr. Alan Turing', history: [
        { timestamp: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(), status: 'In Stock', actorId: 'user-evelyn-reed', notes: 'Minted from PO-12300' },
        { timestamp: new Date(Date.now() - 19 * 24 * 3600 * 1000).toISOString(), status: 'Assigned', locationType: 'Teacher', locationId: 't-1', actorId: 'user-evelyn-reed' },
    ]},
    { id: 'ASSET-00002', itemId: 'item-1', serialNumber: 'SN-E5F6G7H8', status: 'In Stock', history: [
        { timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), status: 'In Stock', actorId: 'user-evelyn-reed', notes: 'Minted from PO-12300' }
    ]},
    { id: 'ASSET-00003', itemId: 'item-2', serialNumber: 'PJ-XYZ-987', status: 'In Repair', history: [
        { timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), status: 'In Stock', actorId: 'user-evelyn-reed' },
        { timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), status: 'In Repair', actorId: 'user-evelyn-reed', notes: 'Lamp flickering' }
    ]},
];

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listItems = async (): Promise<InventoryItem[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(MOCK_INVENTORY_ITEMS));
};

export const createItem = async (input: Omit<InventoryItem, 'id'>, actor: User): Promise<InventoryItem> => {
    await delay(500);
    const newItem: InventoryItem = {
        ...input,
        id: `item-${Date.now()}`,
        sku: input.sku || `SKU-${Date.now().toString().slice(-6)}`,
    };
    MOCK_INVENTORY_ITEMS.push(newItem);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'INVENTORY', entityType: 'Item', entityId: newItem.id, entityDisplay: newItem.name, after: newItem });
    return newItem;
};

export const updateItem = async (id: string, input: Partial<Omit<InventoryItem, 'id'>>, actor: User): Promise<InventoryItem> => {
    await delay(500);
    const index = MOCK_INVENTORY_ITEMS.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Item not found");
    
    const before = { ...MOCK_INVENTORY_ITEMS[index] };
    MOCK_INVENTORY_ITEMS[index] = { ...MOCK_INVENTORY_ITEMS[index], ...input };
    const after = MOCK_INVENTORY_ITEMS[index];

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'INVENTORY', entityType: 'Item', entityId: id, entityDisplay: after.name, before, after });
    return after;
};

export const toggleItemStatus = async (id: string, active: boolean, actor: User): Promise<void> => {
    await updateItem(id, { active }, actor);
};

// --- Supplier Management ---
export const listSuppliers = async (): Promise<Supplier[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(MOCK_SUPPLIERS));
};

export const createSupplier = async (input: Omit<Supplier, 'id'>, actor: User): Promise<Supplier> => {
    await delay(500);
    const newSupplier: Supplier = { ...input, id: `sup-${Date.now()}` };
    MOCK_SUPPLIERS.push(newSupplier);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'INVENTORY', entityType: 'Supplier', entityId: newSupplier.id, entityDisplay: newSupplier.name, after: newSupplier });
    return newSupplier;
};

export const updateSupplier = async (id: string, input: Partial<Omit<Supplier, 'id'>>, actor: User): Promise<Supplier> => {
    await delay(500);
    const index = MOCK_SUPPLIERS.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Supplier not found");

    const before = { ...MOCK_SUPPLIERS[index] };
    MOCK_SUPPLIERS[index] = { ...MOCK_SUPPLIERS[index], ...input };
    const after = MOCK_SUPPLIERS[index];

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'INVENTORY', entityType: 'Supplier', entityId: id, entityDisplay: after.name, before, after });
    return after;
};

export const toggleSupplierStatus = async (id: string, active: boolean, actor: User): Promise<void> => {
    await updateSupplier(id, { active }, actor);
};

export const getSupplierDetails = async (supplierId: string): Promise<(Supplier & { transactions: (StockTransaction & { itemName: string })[] }) | null> => {
    await delay(400);
    const supplier = MOCK_SUPPLIERS.find(s => s.id === supplierId);
    if (!supplier) return null;

    const transactions = MOCK_STOCK_TRANSACTIONS.filter(txn => txn.supplierId === supplierId);
    const itemMap = new Map(MOCK_INVENTORY_ITEMS.map(i => [i.id, i.name]));
    
    const transactionsWithItemName = transactions.map(txn => ({
        ...txn,
        itemName: itemMap.get(txn.itemId) || 'Unknown Item',
    }));

    return {
        ...supplier,
        transactions: transactionsWithItemName,
    };
};

// --- Stock Management ---

export const getItemBySkuOrId = async (identifier: string): Promise<InventoryItem | null> => {
    await delay(250);
    const normalizedId = identifier.toLowerCase();
    return MOCK_INVENTORY_ITEMS.find(i => i.id.toLowerCase() === normalizedId || i.sku.toLowerCase() === normalizedId) || null;
};

export const getCurrentStock = async (itemId: string): Promise<number> => {
    await delay(100);
    return MOCK_STOCK_TRANSACTIONS
        .filter(txn => txn.itemId === itemId)
        .reduce((sum, txn) => sum + txn.quantity, 0);
};

export const listTransactionsForItem = async (itemId: string): Promise<StockTransaction[]> => {
    await delay(300);
    return MOCK_STOCK_TRANSACTIONS
        .filter(txn => txn.itemId === itemId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const recordStockTransaction = async (
    input: Omit<StockTransaction, 'id' | 'createdAt' | 'actorId'>,
    actor: User
): Promise<StockTransaction> => {
    await delay(600);
    if (input.quantity === 0) throw new Error("Quantity cannot be zero.");
    const newTransaction: StockTransaction = { ...input, id: `txn-${Date.now()}`, createdAt: new Date().toISOString(), actorId: actor.id, };
    MOCK_STOCK_TRANSACTIONS.push(newTransaction);
    const item = await getItemBySkuOrId(input.itemId);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'INVENTORY', entityType: 'StockLevel', entityId: input.itemId, entityDisplay: item?.name, meta: { type: input.type, qty: input.quantity }});
    return newTransaction;
};

// --- Issue Requests ---
export const listIssueRequests = async (): Promise<IssueRequest[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(MOCK_ISSUE_REQUESTS.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())));
};

export const createIssueRequest = async (input: Omit<IssueRequest, 'id' | 'status' | 'requestedAt'>, actor: User): Promise<IssueRequest> => {
    await delay(500);
    const newRequest: IssueRequest = { ...input, id: `req-${Date.now()}`, status: 'Pending', requestedAt: new Date().toISOString(), };
    MOCK_ISSUE_REQUESTS.push(newRequest);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'REQUEST', module: 'INVENTORY', entityType: 'IssueRequest', entityId: newRequest.id, after: newRequest });
    return newRequest;
};

export const updateIssueRequestStatus = async (requestId: string, status: 'Approved' | 'Rejected' | 'Cancelled', actor: User): Promise<IssueRequest> => {
    await delay(500);
    const request = MOCK_ISSUE_REQUESTS.find(r => r.id === requestId);
    if (!request) throw new Error("Request not found");
    request.status = status;
    return request;
};

export const fulfillIssueRequest = async (requestId: string, actor: User): Promise<IssueRequest> => {
    await delay(800);
    const request = MOCK_ISSUE_REQUESTS.find(r => r.id === requestId);
    if (!request || request.status !== 'Approved') throw new Error("Only approved requests can be fulfilled.");
    await recordStockTransaction({ itemId: request.itemId, type: 'OUT', quantity: -request.quantity, toEntityType: 'Teacher', toEntityId: request.requesterId, ref: `REQ-${request.id}`, }, actor);
    request.status = 'Fulfilled';
    return request;
};

// --- Asset Management ---

export const listAssets = async (): Promise<Asset[]> => {
    await delay(500);
    return JSON.parse(JSON.stringify(MOCK_ASSETS));
};

export const getAssetDetails = async (assetId: string): Promise<Asset | null> => {
    await delay(300);
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    return asset ? JSON.parse(JSON.stringify(asset)) : null;
};

export const mintAssets = async (itemId: string, quantity: number, actor: User): Promise<Asset[]> => {
    await delay(800);
    const item = MOCK_INVENTORY_ITEMS.find(i => i.id === itemId);
    if (!item || !item.trackAsset) throw new Error("Cannot mint assets for a non-trackable item.");

    const lastAssetNum = MOCK_ASSETS.reduce((max, a) => Math.max(max, parseInt(a.id.split('-')[1])), 0);
    const newAssets: Asset[] = [];
    for (let i = 0; i < quantity; i++) {
        const newAsset: Asset = {
            id: `ASSET-${(lastAssetNum + i + 1).toString().padStart(5, '0')}`,
            itemId: item.id,
            status: 'In Stock',
            history: [{ timestamp: new Date().toISOString(), status: 'In Stock', actorId: actor.id, notes: 'Minted' }]
        };
        newAssets.push(newAsset);
    }
    MOCK_ASSETS.push(...newAssets);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'ASSETS', entityType: 'Asset', entityDisplay: `${quantity} x ${item.name}`, meta: { quantity } });
    return newAssets;
};

export const assignAsset = async (assetId: string, assignedToType: AssetLocationType, assignedToId: string, actor: User): Promise<Asset> => {
    await delay(500);
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (!asset) throw new Error("Asset not found");

    const [classes, teachers] = await Promise.all([getClasses(), listTeachers()]);
    const nameMap = new Map([...classes, ...teachers].map(e => [e.id, e.name]));
    const assignedToName = nameMap.get(assignedToId) || assignedToId;

    asset.status = 'Assigned';
    asset.assignedToType = assignedToType;
    asset.assignedToId = assignedToId;
    asset.assignedToName = assignedToName;
    asset.history.push({ timestamp: new Date().toISOString(), status: 'Assigned', locationType: assignedToType, locationId: assignedToId, actorId: actor.id });

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ASSETS', entityType: 'Asset', entityId: assetId, entityDisplay: assetId, meta: { action: 'Assign', to: assignedToName }});
    return asset;
};

export const updateAssetStatus = async (assetId: string, status: AssetStatus, notes: string, actor: User): Promise<Asset> => {
    await delay(500);
    const asset = MOCK_ASSETS.find(a => a.id === assetId);
    if (!asset) throw new Error("Asset not found");

    asset.status = status;
    if (status !== 'Assigned') {
        asset.assignedToType = undefined;
        asset.assignedToId = undefined;
        asset.assignedToName = undefined;
    }
    asset.history.push({ timestamp: new Date().toISOString(), status, notes, actorId: actor.id });

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ASSETS', entityType: 'Asset', entityId: assetId, entityDisplay: assetId, meta: { newStatus: status, notes }});
    return asset;
};