// Stock Management JavaScript

let stockItems = [];
let stockCategories = [];
let deliveries = [];
let stockAlerts = [];
let currentStockItem = null;
let currentDelivery = null;

// Initialize stock management
async function initStock() {
    try {
        await loadStockCategories();
        await loadStockSummary();
        await loadStockItems();
        await loadDeliveries();
        await loadStockAlerts();
        
        setupStockEventListeners();
    } catch (error) {
        console.error('Error initializing stock:', error);
        showToast('Failed to initialize stock management', 'error');
    }
}

// Setup event listeners
function setupStockEventListeners() {
    // Navigation
    document.getElementById('refreshStockBtn')?.addEventListener('click', refreshStock);
    document.getElementById('addStockItemBtn')?.addEventListener('click', () => openStockItemModal());
    document.getElementById('newDeliveryBtn')?.addEventListener('click', () => openDeliveryModal());
    
    // Stock Item Modal
    document.getElementById('closeStockItemModal')?.addEventListener('click', closeStockItemModal);
    document.getElementById('cancelStockItemBtn')?.addEventListener('click', closeStockItemModal);
    document.getElementById('saveStockItemBtn')?.addEventListener('click', saveStockItem);
    
    // Delivery Modal
    document.getElementById('closeDeliveryModal')?.addEventListener('click', closeDeliveryModal);
    document.getElementById('cancelDeliveryBtn')?.addEventListener('click', closeDeliveryModal);
    document.getElementById('saveDeliveryBtn')?.addEventListener('click', saveDelivery);
    document.getElementById('addDeliveryItemBtn')?.addEventListener('click', addDeliveryItemRow);
    
    // Accept Delivery Modal
    document.getElementById('closeAcceptDeliveryModal')?.addEventListener('click', closeAcceptDeliveryModal);
    document.getElementById('cancelAcceptDeliveryBtn')?.addEventListener('click', closeAcceptDeliveryModal);
    document.getElementById('confirmAcceptDeliveryBtn')?.addEventListener('click', confirmAcceptDelivery);
    document.getElementById('rejectDeliveryBtn')?.addEventListener('click', rejectDelivery);
    
    // Stock Adjustment Modal
    document.getElementById('closeStockAdjustmentModal')?.addEventListener('click', closeStockAdjustmentModal);
    document.getElementById('cancelAdjustmentBtn')?.addEventListener('click', closeStockAdjustmentModal);
    document.getElementById('saveAdjustmentBtn')?.addEventListener('click', saveStockAdjustment);
    
    // Stock Details Modal
    document.getElementById('closeStockDetailsModal')?.addEventListener('click', closeStockDetailsModal);
    document.getElementById('closeStockDetailsBtn')?.addEventListener('click', closeStockDetailsModal);
    
    // Filters
    document.getElementById('stockCategoryFilter')?.addEventListener('change', filterStockItems);
    document.getElementById('stockStatusFilter')?.addEventListener('change', filterStockItems);
    document.getElementById('stockSearchInput')?.addEventListener('input', filterStockItems);
    
    document.getElementById('deliveryStatusFilter')?.addEventListener('change', filterDeliveries);
    document.getElementById('deliveryFromDate')?.addEventListener('change', filterDeliveries);
    document.getElementById('deliveryToDate')?.addEventListener('change', filterDeliveries);
    
    document.getElementById('alertTypeFilter')?.addEventListener('change', filterAlerts);
    document.getElementById('showAcknowledgedAlerts')?.addEventListener('change', filterAlerts);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchStockTab(tab);
        });
    });
}

// Load stock categories
async function loadStockCategories() {
    try {
        const response = await apiRequest('/stock/categories');
        stockCategories = response;
        
        // Populate category dropdowns
        const categorySelects = ['stockItemCategory', 'stockCategoryFilter'];
        categorySelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select && selectId !== 'stockCategoryFilter') {
                select.innerHTML = '<option value="">Select category</option>';
            }
            stockCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select?.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load stock summary
async function loadStockSummary() {
    try {
        const summary = await apiRequest('/stock/reports/summary');
        
        document.getElementById('totalStockItems').textContent = summary.totalItems || 0;
        document.getElementById('lowStockItems').textContent = summary.lowStockItems || 0;
        document.getElementById('outOfStockItems').textContent = summary.outOfStockItems || 0;
        document.getElementById('expiringBatches').textContent = summary.expiringBatches || 0;
        document.getElementById('totalStockValue').textContent = `$${(summary.totalValue || 0).toFixed(2)}`;
        document.getElementById('pendingDeliveries').textContent = summary.pendingDeliveries || 0;
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Load stock items
async function loadStockItems() {
    try {
        stockItems = await apiRequest('/stock/items');
        renderStockItems(stockItems);
    } catch (error) {
        console.error('Error loading stock items:', error);
        showToast('Failed to load stock items', 'error');
    }
}

// Render stock items table
function renderStockItems(items) {
    const tbody = document.getElementById('stockItemsTableBody');
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No stock items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => {
        const statusClass = item.stock_status === 'out' ? 'danger' : 
                          item.stock_status === 'low' ? 'warning' : 'success';
        const statusText = item.stock_status === 'out' ? 'Out of Stock' :
                         item.stock_status === 'low' ? 'Low Stock' : 'In Stock';
        
        const totalValue = (item.current_quantity * item.unit_cost).toFixed(2);
        
        return `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.category_name || '-'}</td>
                <td>${item.sku || '-'}</td>
                <td><strong>${item.current_quantity}</strong> ${item.unit}</td>
                <td>${item.minimum_quantity} / ${item.maximum_quantity}</td>
                <td>$${item.unit_cost.toFixed(2)}</td>
                <td>$${totalValue}</td>
                <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewStockDetails(${item.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="openStockItemModal(${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="openStockAdjustmentModal(${item.id})" title="Adjust Stock">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter stock items
function filterStockItems() {
    const category = document.getElementById('stockCategoryFilter')?.value;
    const status = document.getElementById('stockStatusFilter')?.value;
    const search = document.getElementById('stockSearchInput')?.value.toLowerCase();
    
    let filtered = stockItems;
    
    if (category) {
        filtered = filtered.filter(item => item.category_id == category);
    }
    
    if (status) {
        filtered = filtered.filter(item => item.stock_status === status);
    }
    
    if (search) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(search) ||
            (item.sku && item.sku.toLowerCase().includes(search)) ||
            (item.supplier && item.supplier.toLowerCase().includes(search))
        );
    }
    
    renderStockItems(filtered);
}

// Open stock item modal
async function openStockItemModal(itemId = null) {
    const modal = document.getElementById('stockItemModal');
    const title = document.getElementById('stockItemModalTitle');
    const form = document.getElementById('stockItemForm');
    
    form.reset();
    document.getElementById('stockItemId').value = '';
    
    if (itemId) {
        title.textContent = 'Edit Stock Item';
        try {
            const item = await apiRequest(`/stock/items/${itemId}`);
            document.getElementById('stockItemId').value = item.id;
            document.getElementById('stockItemName').value = item.name;
            document.getElementById('stockItemCategory').value = item.category_id;
            document.getElementById('stockItemUnit').value = item.unit;
            document.getElementById('stockItemSKU').value = item.sku || '';
            document.getElementById('stockItemSupplier').value = item.supplier || '';
            document.getElementById('stockItemMinQty').value = item.minimum_quantity;
            document.getElementById('stockItemMaxQty').value = item.maximum_quantity;
            document.getElementById('stockItemUnitCost').value = item.unit_cost;
            document.getElementById('stockItemNotes').value = item.notes || '';
        } catch (error) {
            showToast('Failed to load stock item', 'error');
            return;
        }
    } else {
        title.textContent = 'Add Stock Item';
    }
    
    modal.classList.remove('hidden');
}

function closeStockItemModal() {
    document.getElementById('stockItemModal').classList.add('hidden');
}

// Save stock item
async function saveStockItem() {
    const form = document.getElementById('stockItemForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const itemId = document.getElementById('stockItemId').value;
    const data = {
        name: document.getElementById('stockItemName').value,
        category_id: document.getElementById('stockItemCategory').value,
        unit: document.getElementById('stockItemUnit').value,
        sku: document.getElementById('stockItemSKU').value,
        supplier: document.getElementById('stockItemSupplier').value,
        minimum_quantity: parseFloat(document.getElementById('stockItemMinQty').value),
        maximum_quantity: parseFloat(document.getElementById('stockItemMaxQty').value),
        unit_cost: parseFloat(document.getElementById('stockItemUnitCost').value),
        notes: document.getElementById('stockItemNotes').value
    };
    
    try {
        const saveBtn = document.getElementById('saveStockItemBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        if (itemId) {
            await apiRequest(`/stock/items/${itemId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            showToast('Stock item updated successfully', 'success');
        } else {
            await apiRequest('/stock/items', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('Stock item created successfully', 'success');
        }
        
        closeStockItemModal();
        await refreshStock();
    } catch (error) {
        showToast(error.message || 'Failed to save stock item', 'error');
    } finally {
        const saveBtn = document.getElementById('saveStockItemBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Item';
    }
}

// Load deliveries
async function loadDeliveries() {
    try {
        deliveries = await apiRequest('/stock/deliveries');
        renderDeliveries(deliveries);
    } catch (error) {
        console.error('Error loading deliveries:', error);
        showToast('Failed to load deliveries', 'error');
    }
}

// Render deliveries table
function renderDeliveries(items) {
    const tbody = document.getElementById('deliveriesTableBody');
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No deliveries found</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(delivery => {
        const statusClass = delivery.status === 'accepted' ? 'success' :
                          delivery.status === 'rejected' ? 'danger' : 'warning';
        
        return `
            <tr>
                <td>${formatDate(delivery.delivery_date)}</td>
                <td><strong>${delivery.supplier}</strong></td>
                <td>${delivery.invoice_number || '-'}</td>
                <td>$${(delivery.invoice_amount || 0).toFixed(2)}</td>
                <td>${delivery.item_count || 0} items</td>
                <td><span class="badge badge-${statusClass}">${delivery.status}</span></td>
                <td>${delivery.received_by_name || '-'}</td>
                <td>
                    <button class="btn-icon" onclick="viewDeliveryDetails(${delivery.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${delivery.status === 'pending' ? `
                        <button class="btn-icon btn-success" onclick="openAcceptDeliveryModal(${delivery.id})" title="Accept Delivery">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Filter deliveries
function filterDeliveries() {
    const status = document.getElementById('deliveryStatusFilter')?.value;
    const fromDate = document.getElementById('deliveryFromDate')?.value;
    const toDate = document.getElementById('deliveryToDate')?.value;
    
    let filtered = deliveries;
    
    if (status) {
        filtered = filtered.filter(d => d.status === status);
    }
    
    if (fromDate) {
        filtered = filtered.filter(d => d.delivery_date >= fromDate);
    }
    
    if (toDate) {
        filtered = filtered.filter(d => d.delivery_date <= toDate);
    }
    
    renderDeliveries(filtered);
}

// Open delivery modal
function openDeliveryModal(deliveryId = null) {
    const modal = document.getElementById('deliveryModal');
    const title = document.getElementById('deliveryModalTitle');
    const form = document.getElementById('deliveryForm');
    
    form.reset();
    document.getElementById('deliveryId').value = '';
    document.getElementById('deliveryItemsList').innerHTML = '';
    
    // Set today's date as default
    document.getElementById('deliveryDate').valueAsDate = new Date();
    
    if (deliveryId) {
        title.textContent = 'Edit Delivery';
        // Load delivery data if editing
    } else {
        title.textContent = 'New Delivery';
        // Add one empty item row
        addDeliveryItemRow();
    }
    
    modal.classList.remove('hidden');
}

function closeDeliveryModal() {
    document.getElementById('deliveryModal').classList.add('hidden');
}

// Add delivery item row
function addDeliveryItemRow() {
    const container = document.getElementById('deliveryItemsList');
    const index = container.children.length;
    
    const row = document.createElement('div');
    row.className = 'delivery-item-row';
    row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
    
    row.innerHTML = `
        <div class="form-group" style="margin: 0;">
            <label class="form-label">Stock Item</label>
            <select class="form-select delivery-item-select" required>
                <option value="">Select item</option>
                ${stockItems.map(item => `<option value="${item.id}">${item.name} (${item.unit})</option>`).join('')}
            </select>
        </div>
        <div class="form-group" style="margin: 0;">
            <label class="form-label">Quantity</label>
            <input type="number" class="form-input delivery-item-quantity" step="0.01" min="0" required>
        </div>
        <div class="form-group" style="margin: 0;">
            <label class="form-label">Unit Cost</label>
            <input type="number" class="form-input delivery-item-cost" step="0.01" min="0">
        </div>
        <div class="form-group" style="margin: 0;">
            <label class="form-label">Expiry Date</label>
            <input type="date" class="form-input delivery-item-expiry">
        </div>
        <div class="form-group" style="margin: 0;">
            <label class="form-label">Batch #</label>
            <input type="text" class="form-input delivery-item-batch">
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()" style="margin-top: 1.5rem;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(row);
}

// Save delivery
async function saveDelivery() {
    const form = document.getElementById('deliveryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collect delivery items
    const itemRows = document.querySelectorAll('.delivery-item-row');
    if (itemRows.length === 0) {
        showToast('Please add at least one item', 'error');
        return;
    }
    
    const items = [];
    for (const row of itemRows) {
        const stockItemId = row.querySelector('.delivery-item-select').value;
        const quantity = row.querySelector('.delivery-item-quantity').value;
        
        if (!stockItemId || !quantity) {
            showToast('Please fill in all required item fields', 'error');
            return;
        }
        
        items.push({
            stock_item_id: parseInt(stockItemId),
            quantity: parseFloat(quantity),
            unit_cost: parseFloat(row.querySelector('.delivery-item-cost').value) || 0,
            expiry_date: row.querySelector('.delivery-item-expiry').value || null,
            batch_number: row.querySelector('.delivery-item-batch').value || null
        });
    }
    
    const data = {
        delivery_date: document.getElementById('deliveryDate').value,
        supplier: document.getElementById('deliverySupplier').value,
        invoice_number: document.getElementById('deliveryInvoiceNumber').value,
        invoice_amount: parseFloat(document.getElementById('deliveryInvoiceAmount').value) || 0,
        notes: document.getElementById('deliveryNotes').value,
        items: items
    };
    
    try {
        const saveBtn = document.getElementById('saveDeliveryBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        await apiRequest('/stock/deliveries', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showToast('Delivery created successfully', 'success');
        closeDeliveryModal();
        await refreshStock();
    } catch (error) {
        showToast(error.message || 'Failed to save delivery', 'error');
    } finally {
        const saveBtn = document.getElementById('saveDeliveryBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Delivery';
    }
}

// Open accept delivery modal
async function openAcceptDeliveryModal(deliveryId) {
    try {
        const delivery = await apiRequest(`/stock/deliveries/${deliveryId}`);
        currentDelivery = delivery;
        
        const modal = document.getElementById('acceptDeliveryModal');
        const infoDiv = document.getElementById('acceptDeliveryInfo');
        const itemsList = document.getElementById('acceptDeliveryItemsList');
        
        infoDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                <div><strong>Supplier:</strong> ${delivery.supplier}</div>
                <div><strong>Delivery Date:</strong> ${formatDate(delivery.delivery_date)}</div>
                <div><strong>Invoice #:</strong> ${delivery.invoice_number || '-'}</div>
                <div><strong>Invoice Amount:</strong> $${(delivery.invoice_amount || 0).toFixed(2)}</div>
            </div>
            ${delivery.notes ? `<div style="margin-top: 0.5rem;"><strong>Notes:</strong> ${delivery.notes}</div>` : ''}
        `;
        
        itemsList.innerHTML = delivery.items.map((item, index) => `
            <div class="accept-item-row" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1rem; margin-bottom: 0.5rem;">
                    <div><strong>${item.item_name}</strong></div>
                    <div>Expected: <strong>${item.quantity} ${item.unit}</strong></div>
                    <div>Unit Cost: $${(item.unit_cost || 0).toFixed(2)}</div>
                    <div>${item.expiry_date ? `Expires: ${formatDate(item.expiry_date)}` : ''}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Received Quantity</label>
                        <input type="number" class="form-input received-quantity" data-item-id="${item.id}" 
                               value="${item.quantity}" step="0.01" min="0" required>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Damaged Quantity</label>
                        <input type="number" class="form-input damaged-quantity" data-item-id="${item.id}" 
                               value="0" step="0.01" min="0">
                    </div>
                </div>
            </div>
        `).join('');
        
        modal.classList.remove('hidden');
    } catch (error) {
        showToast('Failed to load delivery details', 'error');
    }
}

function closeAcceptDeliveryModal() {
    document.getElementById('acceptDeliveryModal').classList.add('hidden');
    currentDelivery = null;
}

// Confirm accept delivery
async function confirmAcceptDelivery() {
    if (!currentDelivery) return;
    
    const items = [];
    document.querySelectorAll('.accept-item-row').forEach(row => {
        const receivedInput = row.querySelector('.received-quantity');
        const damagedInput = row.querySelector('.damaged-quantity');
        
        items.push({
            id: parseInt(receivedInput.dataset.itemId),
            quantity: parseFloat(receivedInput.value),
            damaged_quantity: parseFloat(damagedInput.value) || 0
        });
    });
    
    try {
        const confirmBtn = document.getElementById('confirmAcceptDeliveryBtn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        await apiRequest(`/stock/deliveries/${currentDelivery.id}/accept`, {
            method: 'POST',
            body: JSON.stringify({ items })
        });
        
        showToast('Delivery accepted successfully', 'success');
        closeAcceptDeliveryModal();
        await refreshStock();
    } catch (error) {
        showToast(error.message || 'Failed to accept delivery', 'error');
    } finally {
        const confirmBtn = document.getElementById('confirmAcceptDeliveryBtn');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Accept Delivery';
    }
}

// Reject delivery
async function rejectDelivery() {
    if (!currentDelivery) return;
    
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;
    
    try {
        await apiRequest(`/stock/deliveries/${currentDelivery.id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        
        showToast('Delivery rejected', 'success');
        closeAcceptDeliveryModal();
        await refreshStock();
    } catch (error) {
        showToast(error.message || 'Failed to reject delivery', 'error');
    }
}

// Open stock adjustment modal
async function openStockAdjustmentModal(itemId) {
    try {
        const item = await apiRequest(`/stock/items/${itemId}`);
        currentStockItem = item;
        
        const modal = document.getElementById('stockAdjustmentModal');
        const infoDiv = document.getElementById('adjustmentItemInfo');
        
        document.getElementById('adjustmentStockItemId').value = item.id;
        
        infoDiv.innerHTML = `
            <div><strong>${item.name}</strong></div>
            <div style="margin-top: 0.5rem;">
                Current Stock: <strong>${item.current_quantity} ${item.unit}</strong>
            </div>
        `;
        
        document.getElementById('stockAdjustmentForm').reset();
        modal.classList.remove('hidden');
    } catch (error) {
        showToast('Failed to load stock item', 'error');
    }
}

function closeStockAdjustmentModal() {
    document.getElementById('stockAdjustmentModal').classList.add('hidden');
    currentStockItem = null;
}

// Save stock adjustment
async function saveStockAdjustment() {
    const form = document.getElementById('stockAdjustmentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const itemId = document.getElementById('adjustmentStockItemId').value;
    const data = {
        quantity: parseFloat(document.getElementById('adjustmentQuantity').value),
        transaction_type: document.getElementById('adjustmentType').value,
        reason: document.getElementById('adjustmentReason').value
    };
    
    try {
        const saveBtn = document.getElementById('saveAdjustmentBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        await apiRequest(`/stock/items/${itemId}/adjust`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showToast('Stock adjusted successfully', 'success');
        closeStockAdjustmentModal();
        await refreshStock();
    } catch (error) {
        showToast(error.message || 'Failed to adjust stock', 'error');
    } finally {
        const saveBtn = document.getElementById('saveAdjustmentBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Adjustment';
    }
}

// View stock details
async function viewStockDetails(itemId) {
    try {
        const item = await apiRequest(`/stock/items/${itemId}`);
        const batches = await apiRequest(`/stock/items/${itemId}/batches`);
        const transactions = await apiRequest(`/stock/items/${itemId}/transactions`);
        
        const modal = document.getElementById('stockDetailsModal');
        const title = document.getElementById('stockDetailsTitle');
        const content = document.getElementById('stockDetailsContent');
        
        title.textContent = item.name;
        
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                <div><strong>Category:</strong> ${item.category_name}</div>
                <div><strong>SKU:</strong> ${item.sku || '-'}</div>
                <div><strong>Supplier:</strong> ${item.supplier || '-'}</div>
                <div><strong>Unit:</strong> ${item.unit}</div>
                <div><strong>Current Stock:</strong> ${item.current_quantity} ${item.unit}</div>
                <div><strong>Min/Max:</strong> ${item.minimum_quantity} / ${item.maximum_quantity}</div>
                <div><strong>Unit Cost:</strong> $${item.unit_cost.toFixed(2)}</div>
                <div><strong>Total Value:</strong> $${(item.current_quantity * item.unit_cost).toFixed(2)}</div>
            </div>
            
            ${batches.length > 0 ? `
                <h4 style="margin-bottom: 1rem;">Active Batches</h4>
                <table class="data-table" style="margin-bottom: 2rem;">
                    <thead>
                        <tr>
                            <th>Batch #</th>
                            <th>Remaining</th>
                            <th>Expiry Date</th>
                            <th>Received</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${batches.map(batch => `
                            <tr>
                                <td>${batch.batch_number || '-'}</td>
                                <td>${batch.remaining_quantity} ${item.unit}</td>
                                <td>${batch.expiry_date ? formatDate(batch.expiry_date) : '-'}</td>
                                <td>${formatDate(batch.received_date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}
            
            <h4 style="margin-bottom: 1rem;">Recent Transactions</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Performed By</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.length > 0 ? transactions.map(trans => `
                        <tr>
                            <td>${formatDateTime(trans.performed_at)}</td>
                            <td>${trans.transaction_type}</td>
                            <td>${trans.quantity > 0 ? '+' : ''}${trans.quantity}</td>
                            <td>${trans.performed_by_name}</td>
                            <td>${trans.notes || '-'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="5" class="text-center">No transactions</td></tr>'}
                </tbody>
            </table>
        `;
        
        modal.classList.remove('hidden');
    } catch (error) {
        showToast('Failed to load stock details', 'error');
    }
}

function closeStockDetailsModal() {
    document.getElementById('stockDetailsModal').classList.add('hidden');
}

// View delivery details
async function viewDeliveryDetails(deliveryId) {
    try {
        const delivery = await apiRequest(`/stock/deliveries/${deliveryId}`);
        
        const modal = document.getElementById('stockDetailsModal');
        const title = document.getElementById('stockDetailsTitle');
        const content = document.getElementById('stockDetailsContent');
        
        title.textContent = `Delivery from ${delivery.supplier}`;
        
        const statusClass = delivery.status === 'accepted' ? 'success' :
                          delivery.status === 'rejected' ? 'danger' : 'warning';
        
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                <div><strong>Delivery Date:</strong> ${formatDate(delivery.delivery_date)}</div>
                <div><strong>Status:</strong> <span class="badge badge-${statusClass}">${delivery.status}</span></div>
                <div><strong>Invoice #:</strong> ${delivery.invoice_number || '-'}</div>
                <div><strong>Invoice Amount:</strong> $${(delivery.invoice_amount || 0).toFixed(2)}</div>
                <div><strong>Created By:</strong> ${delivery.created_by_name}</div>
                <div><strong>Received By:</strong> ${delivery.received_by_name || '-'}</div>
            </div>
            
            ${delivery.notes ? `<div style="margin-bottom: 2rem;"><strong>Notes:</strong> ${delivery.notes}</div>` : ''}
            
            <h4 style="margin-bottom: 1rem;">Items</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Cost</th>
                        <th>Total</th>
                        <th>Expiry Date</th>
                        <th>Batch #</th>
                    </tr>
                </thead>
                <tbody>
                    ${delivery.items.map(item => `
                        <tr>
                            <td>${item.item_name}</td>
                            <td>${item.quantity} ${item.unit}</td>
                            <td>$${(item.unit_cost || 0).toFixed(2)}</td>
                            <td>$${(item.quantity * (item.unit_cost || 0)).toFixed(2)}</td>
                            <td>${item.expiry_date ? formatDate(item.expiry_date) : '-'}</td>
                            <td>${item.batch_number || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        modal.classList.remove('hidden');
    } catch (error) {
        showToast('Failed to load delivery details', 'error');
    }
}

// Load stock alerts
async function loadStockAlerts() {
    try {
        stockAlerts = await apiRequest('/stock/alerts?acknowledged=0');
        renderStockAlerts(stockAlerts);
        
        // Update badge
        const badge = document.getElementById('alertsBadge');
        if (stockAlerts.length > 0) {
            badge.textContent = stockAlerts.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Render stock alerts
function renderStockAlerts(alerts) {
    const container = document.getElementById('alertsList');
    if (!container) return;
    
    if (alerts.length === 0) {
        container.innerHTML = '<p class="text-center">No active alerts</p>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => {
        const severityClass = alert.severity === 'critical' ? 'danger' :
                            alert.severity === 'high' ? 'danger' :
                            alert.severity === 'medium' ? 'warning' : 'info';
        
        const iconClass = alert.alert_type === 'low_stock' ? 'fa-exclamation-triangle' :
                        alert.alert_type === 'out_of_stock' ? 'fa-times-circle' :
                        alert.alert_type === 'expiring_soon' ? 'fa-clock' : 'fa-exclamation';
        
        return `
            <div class="alert alert-${severityClass}" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="fas ${iconClass}" style="font-size: 1.5rem;"></i>
                    <div>
                        <div><strong>${alert.item_name || 'Stock Alert'}</strong></div>
                        <div>${alert.message}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            ${formatDateTime(alert.created_at)}
                        </div>
                    </div>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="acknowledgeAlert(${alert.id})">
                    <i class="fas fa-check"></i> Acknowledge
                </button>
            </div>
        `;
    }).join('');
}

// Filter alerts
async function filterAlerts() {
    const type = document.getElementById('alertTypeFilter')?.value;
    const showAcknowledged = document.getElementById('showAcknowledgedAlerts')?.checked;
    
    try {
        const params = new URLSearchParams();
        if (!showAcknowledged) {
            params.append('acknowledged', '0');
        }
        
        let alerts = await apiRequest(`/stock/alerts?${params}`);
        
        if (type) {
            alerts = alerts.filter(a => a.alert_type === type);
        }
        
        renderStockAlerts(alerts);
    } catch (error) {
        console.error('Error filtering alerts:', error);
    }
}

// Acknowledge alert
async function acknowledgeAlert(alertId) {
    try {
        await apiRequest(`/stock/alerts/${alertId}/acknowledge`, {
            method: 'POST'
        });
        
        showToast('Alert acknowledged', 'success');
        await loadStockAlerts();
    } catch (error) {
        showToast('Failed to acknowledge alert', 'error');
    }
}

// Switch stock tab
function switchStockTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`)?.classList.add('active');
}

// Refresh stock data
async function refreshStock() {
    await Promise.all([
        loadStockSummary(),
        loadStockItems(),
        loadDeliveries(),
        loadStockAlerts()
    ]);
    showToast('Stock data refreshed', 'success');
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
}