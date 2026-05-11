const API = "https://smart-fridge-backend-8eqn.onrender.com/api";
let priceTrends = {};
let loadingPrices = false;

function getCurrentAuthContext() {
  const auth = window.freshbyteAuth || {};
  return {
    userId: auth.userId || "",
    name: auth.name || "",
    email: auth.email || "",
  };
}

function getCurrentUserId() {
  return getCurrentAuthContext().userId;
}

function updateSignedOutState() {
  const foodList = document.getElementById("foodList");
  if (foodList) {
    foodList.innerHTML = "<li>Please log in to view your fridge.</li>";
  }

  const statsContent = document.getElementById("statsContent");
  if (statsContent) {
    statsContent.innerHTML = "<p>Please log in to view your stats.</p>";
  }

  const alertsList = document.getElementById("alertsList");
  if (alertsList) {
    alertsList.innerHTML = "<li>Please log in to view alerts.</li>";
  }

  const groceryList = document.getElementById("groceryList");
  if (groceryList) {
    groceryList.innerHTML = "<li>Please log in to view your grocery list.</li>";
  }

  const recipes = document.getElementById("recipes");
  if (recipes) {
    recipes.innerHTML = "<p>Please log in to see personalized recipes.</p>";
  }

  const suggestion = document.getElementById("suggestion");
  if (suggestion) {
    suggestion.innerHTML = "<li>Please log in to see meal suggestions.</li>";
  }

  const totalItems = document.getElementById('dash-total-items');
  if (totalItems) totalItems.innerText = "0";

  const expiringSoon = document.getElementById('dash-expiring-soon');
  if (expiringSoon) expiringSoon.innerText = "0";

  const wasteSaved = document.getElementById('dash-waste-saved');
  if (wasteSaved) wasteSaved.innerText = "0";

  const sustainScore = document.getElementById('dash-sustain-score');
  if (sustainScore) sustainScore.innerText = "0/100";

  const alertBadge = document.getElementById('alert-badge');
  if (alertBadge) alertBadge.innerText = "0";

  const groceryItemsNeeded = document.getElementById("grocery-items-needed");
  if (groceryItemsNeeded) groceryItemsNeeded.innerText = "0";
}

function refreshCurrentUserData() {
  const userId = getCurrentUserId();
  if (!userId) {
    updateSignedOutState();
    return;
  }

  getFoods();
  getStats();
  getAlerts();
  getGroceryList();
  getRecipes();
}

window.addEventListener("freshbyte-auth-changed", refreshCurrentUserData);

// 🔧 DEBUG - Check Backend Status
async function checkBackendStatus() {
  const debugEl = document.getElementById("debugStatus");
  debugEl.innerHTML = "🔄 Checking...";
  
  try {
    // Check health endpoint
    const healthRes = await fetch(`${API}/health`);
    const healthData = await healthRes.json();
    
    debugEl.innerHTML = `
      ✅ Backend Status: ${healthData.status}<br>
      🗄️ MongoDB: ${healthData.mongoConnected ? '✅ Connected' : '❌ Disconnected'}<br>
      🌍 Environment: ${healthData.environment}
    `;
  } catch (error) {
    debugEl.innerHTML = "❌ Cannot reach backend: " + error.message;
    console.error("Backend check error:", error);
  }
}

// 🔧 DEBUG - Test API Connection
async function testAPIConnection() {
  const debugEl = document.getElementById("debugStatus");
  debugEl.innerHTML = "🔄 Testing API...";
  
  try {
    console.log("🌐 Testing:", `${API}/food`);
    const res = await fetch(`${API}/food`);
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
    
    if (res.ok) {
      debugEl.innerHTML = `✅ API connection OK! Found ${data.length || 0} foods in database`;
      if (data.length === 0) {
        debugEl.innerHTML += "<br>💡 Tip: No foods yet. Add food using the form above.";
      }
    } else {
      debugEl.innerHTML = "❌ API error: " + res.status;
    }
  } catch (error) {
    debugEl.innerHTML = "❌ API Error: " + error.message;
    console.error(error);
  }
}

// --- UI NAVIGATION LOGIC ---
function navTo(pageId, title, element) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show target page
  document.getElementById(pageId).classList.add('active');

  // Update navbar active state - remove active from all links
  document.querySelectorAll('.navbar-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to the clicked navbar link if it exists
  const activeLink = document.querySelector(`a.navbar-link[onclick*="${pageId}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

// Expose navTo globally so inline onclick handlers can call it from module script
window.navTo = navTo;

// --- ALERTS MODAL LOGIC ---
function openAlerts() {
  document.getElementById('alerts-modal').classList.add('show');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  getAlerts();
}

function closeAlerts() {
  document.getElementById('alerts-modal').classList.remove('show');
  document.body.style.overflow = ''; // Restore background scrolling
}

// --- FAQ TOGGLE ---
function toggleFaq(button) {
  const faqItem = button.parentElement;
  const isOpen = faqItem.classList.contains('active');
  
  // Close all other open FAQ items
  document.querySelectorAll('.faq-item.active').forEach(item => {
    if (item !== faqItem) {
      item.classList.remove('active');
    }
  });
  
  // Toggle current FAQ item
  faqItem.classList.toggle('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('alerts-modal');
  if (event.target == modal) {
    closeAlerts();
  }
}

// ➕ ADD FOOD
async function addFood() {
  const auth = getCurrentAuthContext();
  const name = document.getElementById("name").value;
  const quantity = document.getElementById("quantity").value;
  const purchaseDate = document.getElementById("date").value;

  if (!auth.userId) {
    alert("Please log in first.");
    return;
  }

  if (!name || !quantity || !purchaseDate) {
    alert("Please fill all fields");
    return;
  }

  try {
    console.log("📤 Sending food data:", { name, quantity, purchaseDate, userId: auth.userId });
    
    const res = await fetch(`${API}/food/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        quantity: parseInt(quantity),
        purchaseDate,
        userId: auth.userId,
        userName: auth.name,
        userEmail: auth.email
      })
    });

    console.log("📥 Response status:", res.status);
    const data = await res.json();
    console.log("📥 Response data:", data);

    if (res.ok) {
      alert("✅ Food added successfully!");
      document.getElementById("name").value = "";
      document.getElementById("quantity").value = "";
      document.getElementById("date").value = "";
      getFoods(); // refresh
    } else {
      alert("❌ Error: " + (data.error || "Unknown error"));
      console.error("Server error details:", data);
    }

  } catch (error) {
    console.error("❌ Network error:", error);
    alert("❌ Failed to add food: " + error.message);
  }
}


// 📋 GET FOODS (UPDATED WITH EAT BUTTON)
async function getFoods() {
  console.log("📋 getFoods clicked");

  const list = document.getElementById("foodList");
  list.innerHTML = "<li>Loading...</li>";

  const userId = getCurrentUserId();
  if (!userId) {
    updateSignedOutState();
    return;
  }

  try {
    console.log("🌐 API URL:", `${API}/food?userId=${encodeURIComponent(userId)}`);
    const res = await fetch(`${API}/food?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("Response status:", res.status);
    console.log("Response headers:", res.headers);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Server error response:", errorText);
      throw new Error("Server error: " + res.status);
    }

    const data = await res.json();
    console.log("Data received:", data);
    console.log("Data length:", data ? data.length : 0);

    list.innerHTML = "";

    // Update Dashboard Stats
    if (document.getElementById('dash-total-items')) {
      document.getElementById('dash-total-items').innerText = data ? data.length : 0;
    }
    
    let expiringCount = 0;

    if (!data || data.length === 0) {
      list.innerHTML = "<li>No foods added yet</li>";
      if (document.getElementById('dash-expiring-soon')) {
         document.getElementById('dash-expiring-soon').innerText = "0";
      }
      return;
    }

    data.forEach(f => {
      const li = document.createElement("li");
      li.className = "food-item-card";

      const calorieText = f.nutrition?.calories 
        ? ` - ${f.nutrition.calories} cal` 
        : "";

      const statusText = f.status 
        ? ` - ${f.status}` 
        : "";

      const isRotten = f.status && f.status.includes("ROTTEN");
      const isHighRisk = f.status && f.status.includes("HIGH");

      if (isHighRisk || isRotten) {
        expiringCount++;
      }

      let alertBadge = "";
      if (isRotten) {
        alertBadge = `<span style="color: var(--danger); font-weight: bold; font-size: 0.9em; padding: 4px 8px; background: rgba(239,68,68,0.1); border-radius: 4px;"> <i data-lucide="alert-circle" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> WASTED (EXPIRED)</span>`;
      } else if (isHighRisk) {
        alertBadge = `<span style="color: var(--warning); font-weight: bold; font-size: 0.9em; padding: 4px 8px; background: rgba(245,158,11,0.1); border-radius: 4px;"> <i data-lucide="alert-triangle" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> EXPIRING SOON</span>`;
      }

      // If it's rotten, only allow wasting it. Otherwise, allow eating it.
      let actionButtons = "";
      if (isRotten) {
        actionButtons = `
          <input type="number" placeholder="Amt" id="amt-${f._id}" class="food-amount-input" value="${f.quantity}">
          <button onclick="wasteFood('${f._id}')" class="food-secondary-btn danger"><i data-lucide="trash-2"></i> Discard</button>
        `;
      } else {
        actionButtons = `
          <input type="number" placeholder="Amt" id="amt-${f._id}" class="food-amount-input">
          <button onclick="consumeFood('${f._id}')" class="food-eat-btn"><i data-lucide="check"></i> Eat</button>
        `;
      }

      li.innerHTML = `
        <div class="food-card-glow"></div>
        <div class="food-header">
          <div class="food-title-group">
            <div class="food-header-row">
              <b class="food-name">${f.name}</b>
              <span class="food-qty">Qty: ${f.quantity}</span>
            </div>
          </div>
          <div>${alertBadge}</div>
        </div>
        <div class="food-chips">
          ${statusText ? `<span class="food-chip">${f.status}</span>` : ""}
          ${f.nutrition?.calories ? `<span class="food-chip food-chip-calories"><span>⚡</span><span>${f.nutrition.calories} cal</span></span>` : ""}
        </div>
        <div class="food-actions">
          ${actionButtons}
        </div>
      `;

      list.appendChild(li);
    });

    if (document.getElementById('dash-expiring-soon')) {
      document.getElementById('dash-expiring-soon').innerText = expiringCount;
    }
    
    // Re-initialize icons for newly added elements
    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error("❌ Error fetching foods:", error);
    list.innerHTML = `<li style="color:red;">Error: ${error.message}</li>`;
  }
}

// 🍽️ CONSUME FOOD (NO ID INPUT NEEDED)
async function consumeFood(foodId) {
  const auth = getCurrentAuthContext();
  const amount = document.getElementById(`amt-${foodId}`).value;

  if (!auth.userId) {
    alert("Please log in first.");
    return;
  }

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  try {
    const res = await fetch(`${API}/food/consume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        foodId,
        quantityConsumed: parseInt(amount),
        userId: auth.userId,
        userName: auth.name,
        userEmail: auth.email
      })
    });

    const data = await res.json();
    alert(data.message);

    getFoods(); // refresh list
    getStats(); // refresh stats
    getGroceryList(); // refresh grocery list if needed
  } catch (error) {
    console.error("❌ Error consuming food:", error);
  }
}

// 🗑️ WASTE FOOD
async function wasteFood(foodId) {
  const auth = getCurrentAuthContext();
  const amount = document.getElementById(`amt-${foodId}`).value;

  if (!auth.userId) {
    alert("Please log in first.");
    return;
  }

  if (!amount || amount <= 0) {
    alert("❌ Enter valid amount");
    return;
  }

  try {
    const res = await fetch(`${API}/food/waste`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        foodId,
        quantityWasted: parseInt(amount),
        userId: auth.userId,
        userName: auth.name,
        userEmail: auth.email
      })
    });

    const data = await res.json();
    alert(data.message);

    getFoods(); // refresh list
    getStats(); // refresh stats
    getGroceryList(); // refresh grocery list if needed
  } catch (error) {
    console.error("❌ Error wasting food:", error);
  }
}

// 🌍 GET USER STATS & SUSTAINABILITY
function calculateSustainabilityScore(data) {
  console.log("Stats data:", data);

  // Historical data from backend
  const wastedCount = Number(data.foodWasted ?? data.wasted ?? data.wasteCount ?? 0);
  const foodSaved = Number(data.foodSaved ?? data.saved ?? data.wasteSaved ?? 0);

  // Current fridge state from UI (safely parsed to avoid NaN if UI shows '--' or is loading)
  const totalText = document.getElementById('dash-total-items')?.innerText || "0";
  const totalItems = parseInt(totalText) || 0;

  const expiringText = document.getElementById('dash-expiring-soon')?.innerText || "0";
  const expiringSoon = parseInt(expiringText) || 0;

  let score = 80; // Base score

  // 1. Current Fridge Health
  score += totalItems * 1;        // Reward for stocking the fridge (+1 per item)
  score -= expiringSoon * 5;      // Heavy penalty for items about to expire (-5 per item)

  // 2. Historical Actions
  score += foodSaved * 1.5;       // Bonus for successfully eating food
  score -= wastedCount * 1.5;     // Penalty for past waste

  // Ensure score stays between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
}

async function getStats() {
  const userId = getCurrentUserId();
  if (!userId) {
    updateSignedOutState();
    return;
  }

  try {
    const res = await fetch(`${API}/auth/stats/${encodeURIComponent(userId)}`);
    const data = await res.json();
    console.log("Stats API response:", data);
    const statsContent = document.getElementById("statsContent");

    if (res.ok) {
      const wastedCount = Number(data.foodWasted ?? data.wasted ?? data.wasteCount ?? 0);
      const expiredCount = Number(data.expiredItems ?? data.expiringSoon ?? data.expiredCount ?? 0);
      const foodSaved = Number(data.foodSaved ?? data.saved ?? data.wasteSaved ?? 0);
      const sustainabilityScore = calculateSustainabilityScore(data);

      // Update Dashboard Stats
      if (document.getElementById('dash-waste-saved')) {
        document.getElementById('dash-waste-saved').innerText = foodSaved;
      }
      if (document.getElementById('dash-sustain-score')) {
        document.getElementById('dash-sustain-score').innerText = `${sustainabilityScore}/100`;
      }

      const colorClass = sustainabilityScore > 50 ? 'green' : 'red';
      statsContent.innerHTML = `
        <div class="stats-grid">
          <div class="stat-box">
            <h4>Food Saved</h4>
            <div class="val">${foodSaved}</div>
          </div>
          <div class="stat-box">
            <h4>Food Wasted</h4>
            <div class="val">${wastedCount}</div>
          </div>
          <div class="stat-box">
            <h4>Score</h4>
            <div class="val ${colorClass}">${sustainabilityScore}/100</div>
          </div>
        </div>
      `;
    } else {
      statsContent.innerHTML = `<p style="color:red">Failed to load stats.</p>`;
    }
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
  }
}

// 🔔 GET ALERTS
async function getAlerts() {
  const userId = getCurrentUserId();
  if (!userId) {
    updateSignedOutState();
    return;
  }

  try {
    const res = await fetch(`${API}/alerts/${encodeURIComponent(userId)}`);
    const data = await res.json();
    const list = document.getElementById("alertsList");
    list.innerHTML = "";

    if (res.ok && data.notifications && data.notifications.length > 0) {
      document.getElementById("alert-badge").innerText = data.notifications.length;
      data.notifications.forEach(n => {
        const li = document.createElement("li");
        li.className = "alert-item";
        li.innerHTML = `<strong style="color:var(--warning)">${n.name}</strong> (Qty: ${n.quantity}) - ${n.status}`;
        list.appendChild(li);
      });
    } else {
      document.getElementById("alert-badge").innerText = "0";
      list.innerHTML = "<li>No expiring items!</li>";
    }
  } catch (error) {
    console.error("❌ Error fetching alerts:", error);
  }
}

// 🛒 GET GROCERY LIST
async function getGroceryList() {
  const userId = getCurrentUserId();
  if (!userId) {
    updateSignedOutState();
    return;
  }

  try {
    const res = await fetch(`${API}/grocery/${encodeURIComponent(userId)}`);
    const data = await res.json();
    const list = document.getElementById("groceryList");
    list.innerHTML = "";

    const itemsNeededEl = document.getElementById("grocery-items-needed");
    if (itemsNeededEl) {
      itemsNeededEl.innerText = res.ok && data.length > 0 ? data.length : 0;
    }

    if (res.ok && data.length > 0) {
      renderGroceryItems(data);
      fetchPricesFromBackend(data);
    } else {
      list.innerHTML = "<li>Your grocery list is empty!</li>";
    }
  } catch (error) {
    console.error("❌ Error fetching grocery list:", error);
  }
}

function renderGroceryItems(items) {
  const list = document.getElementById("groceryList");
  if (!list) return;

  list.innerHTML = "";

  items.forEach(item => {
    const itemKey = item.name.toLowerCase();
    const li = document.createElement("li");
    li.className = "grocery-item-card";
    li.innerHTML = `
      <div class="grocery-card-glow"></div>
      <label class="grocery-item-row">
        <div class="grocery-left-side">
          <input type="checkbox" class="grocery-checkbox" ${item.isPurchased ? "checked" : ""} onchange="updateGroceryItem('${item._id}', this.checked)">
          <div class="grocery-item-copy">
            <span class="grocery-item-name ${item.isPurchased ? "is-purchased" : ""}">${item.name}</span>
            ${loadingPrices
              ? '<span class="grocery-item-meta grocery-price-loading">✨ AI fetching price...</span>'
              : priceTrends[itemKey]
                ? `<span class="grocery-item-meta grocery-price-trend">📈 Est. ${priceTrends[itemKey]}</span>`
                : '<span class="grocery-item-meta">Price unavailable</span>'
            }
          </div>
        </div>
        <div class="grocery-badges">
          <span class="grocery-qty-badge">Qty: ${item.quantity}</span>
          <span class="grocery-status-badge">Low Stock</span>
        </div>
      </label>
    `;
    list.appendChild(li);
  });
}

async function fetchPricesFromBackend(items) {
  if (!items || items.length === 0) {
    priceTrends = {};
    loadingPrices = false;
    return;
  }

  loadingPrices = true;
  renderGroceryItems(items);

  setTimeout(() => {
    try {
      const mockResponse = {
        potato: "₹30/kg",
        lemon: "₹100/kg",
        milk: "₹55/L",
        apple: "₹150/kg",
        ginger: "₹120/kg",
        carrot: "₹40/kg"
      };

      priceTrends = mockResponse;
    } catch (error) {
      console.error("❌ Error fetching price trends:", error);
      priceTrends = {};
    } finally {
      loadingPrices = false;
      renderGroceryItems(items);
    }
  }, 2000);
}

async function updateGroceryItem(itemId, isPurchased) {
  try {
    await fetch(`${API}/grocery/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPurchased })
    });
    getGroceryList();
  } catch (error) {
    console.error("❌ Error updating grocery item:", error);
  }
}


// 🤖 GET SUGGESTION
async function getSuggestion() {
  const targetCalories = document.getElementById("cal").value;
  const targetProtein = document.getElementById("protein").value;
  const targetFat = document.getElementById("fat").value;

  if (!targetCalories) {
    alert("Please enter target calories");
    return;
  }

  const list = document.getElementById("suggestion");
  list.innerHTML = "<li><i data-lucide=\"loader\"></i> Calculating AI Meal Plan...</li>";

  try {
    console.log("📋 Fetching suggestion...");
    const res = await fetch(`${API}/goal/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetCalories: parseInt(targetCalories),
        targetProtein: parseInt(targetProtein) || 0,
        targetFat: parseInt(targetFat) || 0
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Server error: " + res.status);
    }

    console.log("Suggestion data:", data);
    list.innerHTML = "";

    if (!data.selectedFoods || data.selectedFoods.length === 0) {
      list.innerHTML = "<li>No foods match your goal yet.</li>";
      return;
    }

    data.selectedFoods.forEach(f => {
      const li = document.createElement("li");
      li.style.marginBottom = "8px";
      li.innerHTML = `Eat <strong>${f.recommendedQuantity}x</strong> ${f.name} <br>
      <span style="font-size:0.85em; color:gray;">(${f.calories} cal | ${f.protein}g protein | ${f.fat}g fat)</span>`;
      list.appendChild(li);
    });

    // Show totals
    const totalLi = document.createElement("li");
    totalLi.style.fontWeight = "bold";
    totalLi.style.color = "green";
    totalLi.innerText = `📊 Total: ${data.total.calories} cal | ${data.total.protein}g protein | ${data.total.fat}g fat`;
    list.appendChild(totalLi);

  } catch (error) {
    console.error("❌ Error fetching suggestion:", error);
    document.getElementById("suggestion").innerHTML = `<li style='color:red;'>Error: ${error.message}</li>`;
  }
}


// 🧑‍🍳 GET AI CHEF RECIPES
async function getRecipes() {
  const userId = getCurrentUserId();
  if (!userId) {
    const div = document.getElementById("recipes");
    if (div) {
      div.innerHTML = "<p>Please log in to see personalized recipes.</p>";
    }
    return;
  }

  try {
    const div = document.getElementById("recipes");
    div.innerHTML = "<p><i data-lucide=\"loader\"></i> AI Chef is crafting your personalized recipes...</p>";

    console.log("Fetching AI recipes...");
    const res = await fetch(`${API}/recipes/suggest?userId=${encodeURIComponent(userId)}`);

    if (!res.ok) {
      throw new Error("Server error: " + res.status);
    }

    const data = await res.json();
    console.log("AI Recipes data:", data);

    div.innerHTML = "";

    if (!data.recipes || data.recipes.length === 0) {
      div.innerHTML = "<p style='color: var(--warning);'><i data-lucide=\"info\"></i> Add some food to your fridge first!</p>";
      return;
    }

    // Show AI recipes
    data.recipes.forEach(r => {
      const el = document.createElement("div");
      el.className = "recipe-card";

      const ingList = r.ingredients ? r.ingredients.map(i => `<li>${i}</li>`).join("") : "None specified";

      el.innerHTML = `
        <h3>${r.title}</h3>
        <p class="desc">${r.description || ""}</p>
        <h4 style="margin-bottom: 8px; color: var(--text-main);">🥘 Ingredients from your fridge:</h4>
        <ul style="margin-top: 0; margin-bottom: 16px;">${ingList}</ul>
        <h4 style="margin-bottom: 8px; color: var(--text-main);">📜 Instructions:</h4>
        <p style="white-space: pre-line; font-size: 0.95em; color: var(--text-muted);">${r.instructions || "Just mix everything and enjoy!"}</p>
      `;
      div.appendChild(el);
    });

  } catch (error) {
    console.error("❌ Error fetching recipes:", error);
    document.getElementById("recipes").innerHTML = `<p style='color:red;'>Error: ${error.message}</p>`;
  }
}

// 📸 SCAN FRIDGE IMAGE (VISION AI)
async function scanFridgeImage() {
  const fileInput = document.getElementById("fridgeImage");
  const list = document.getElementById("scannedItemsList");
  
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select an image first!");
    return;
  }

  list.innerHTML = "<li><i data-lucide=\"loader\"></i> Scanning fridge... please wait.</li>";

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  try {
    const res = await fetch(`${API}/vision/scan`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    list.innerHTML = "";
    if (res.ok && data.items && data.items.length > 0) {
      list.innerHTML = "<li style='color:var(--success); font-weight:bold;'><i data-lucide=\"check-circle\"></i> Identified Items:</li>";
      data.items.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${item} 
          <button onclick="navTo('page-fridge', 'Food Inventory', document.querySelectorAll('.nav-item')[1]); document.getElementById('name').value='${item}'; window.scrollTo(0, 0);" style="padding: 6px 12px; font-size: 0.85em; margin-left: auto;" class="secondary">Quick Add</button>
        `;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = "<li><i data-lucide=\"x-circle\"></i> Could not identify any foods clearly.</li>";
    }

  } catch (error) {
    console.error("Vision Error:", error);
    list.innerHTML = `<li style="color:red;">Error: ${error.message}</li>`;
  }
}

// Expose inline event handlers globally for Vite deployment
window.addFood = addFood;
window.getFoods = getFoods;
window.getRecipes = getRecipes;
window.consumeFood = consumeFood;
window.closeAlerts = closeAlerts;
window.openAlerts = openAlerts;
window.scanFridgeImage = scanFridgeImage;
window.getGroceryList = getGroceryList;
window.getSuggestion = getSuggestion;
window.getStats = getStats;
window.wasteFood = wasteFood;
window.toggleFaq = toggleFaq;
window.navTo = navTo;

// 🔄 AUTO LOAD FOODS WHEN PAGE OPENS
window.onload = () => {
  refreshCurrentUserData();
  
  if (window.lucide) {
    lucide.createIcons();
  }
};