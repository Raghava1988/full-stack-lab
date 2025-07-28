import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, X, WashingMachine, Shirt, Trash2, MoreVertical, Sparkles, Wand2, LogOut } from 'lucide-react';

// --- API Configuration ---
const API_BASE_URL = 'https://digirobe-7cbf57496f69.herokuapp.com';

// =================================================================================
// --- Main App Component (Handles Routing and Auth State) ---
// =================================================================================
export default function App() {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));

    const handleLogin = (token) => {
        localStorage.setItem('authToken', token);
        setAuthToken(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
    };

    return (
        <div className="bg-gray-100 font-sans min-h-screen">
            {authToken ? (
                <WardrobeApp token={authToken} onLogout={handleLogout} />
            ) : (
                <AuthPage onLogin={handleLogin} />
            )}
        </div>
    );
}

// =================================================================================
// --- Authentication Page Component (Login & Register) ---
// UPDATED: Correctly handles text-based error responses from the backend.
// =================================================================================
function AuthPage({ onLogin }) {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
        const payload = { email, password };

        try {
            const response = await fetch(API_BASE_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // If the response is NOT successful, handle it as a text-based error
            if (!response.ok) {
                const errorText = await response.text(); // Read the error as plain text
                throw new Error(errorText || (isLoginView ? 'Invalid credentials' : 'Registration failed'));
            }

            // If the response IS successful, handle it as JSON
            if (isLoginView) {
                const data = await response.json(); // This will contain the token
                onLogin(data.token);
            } else {
                const successText = await response.text(); // Read the success message as plain text
                setMessage(successText || 'Registration successful! Please log in.');
                setIsLoginView(true); // Switch to login view after successful registration
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center text-gray-800">
                    {isLoginView ? 'Welcome to Digirobe' : 'Create Your Account'}
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <InputField label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    
                    {error && <p className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                    {message && <p className="text-sm text-center text-green-600 bg-green-50 p-3 rounded-md">{message}</p>}

                    <div>
                        <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                            {isLoading ? <Spinner /> : (isLoginView ? 'Login' : 'Register')}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-600">
                    {isLoginView ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-blue-600 hover:underline">
                        {isLoginView ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}


// =================================================================================
// --- Main Wardrobe Application Component ---
// =================================================================================
function WardrobeApp({ token, onLogout }) {
    const [clothingItems, setClothingItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeSubCategory, setActiveSubCategory] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [outfitSuggestion, setOutfitSuggestion] = useState(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionError, setSuggestionError] = useState(null);

    const authHeader = { 'Authorization': `Bearer ${token}` };

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${API_BASE_URL}/api/items`, { headers: authHeader });
                if (!response.ok) throw new Error('Failed to fetch data from the server.');
                const data = await response.json();
                setClothingItems(data);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.error("Fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchItems();
    }, [token]);

    const filteredItems = useMemo(() => {
        if (activeCategory === 'Laundry') return clothingItems.filter(item => item.inLaundry);
        return clothingItems.filter(item => {
            const notInLaundry = !item.inLaundry;
            const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
            const subCategoryMatch = activeSubCategory === 'All' || item.subCategory === activeSubCategory;
            return notInLaundry && categoryMatch && (activeCategory !== 'T-Shirts' || subCategoryMatch);
        });
    }, [clothingItems, activeCategory, activeSubCategory]);

    useEffect(() => {
        if (activeCategory !== 'T-Shirts') setActiveSubCategory('All');
    }, [activeCategory]);
    
    const handleAddItem = async (newItem) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/items`, {
                method: 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });
            if (!response.ok) throw new Error('Failed to add item.');
            const savedItem = await response.json();
            setClothingItems(prev => [...prev, savedItem]);
            setIsAddModalOpen(false);
        } catch (err) { console.error("Add item error:", err); }
    };

    const toggleLaundryStatus = async (itemToUpdate) => {
        const updatedItem = { ...itemToUpdate, inLaundry: !itemToUpdate.inLaundry };
        try {
            await fetch(`${API_BASE_URL}/api/items/${itemToUpdate.id}`, {
                method: 'PUT',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            });
            setClothingItems(items => items.map(item => item.id === itemToUpdate.id ? updatedItem : item));
        } catch (err) { console.error("Update laundry error:", err); }
    };

    const clearLaundry = async () => {
        const itemsToWash = clothingItems.filter(item => item.inLaundry);
        try {
            await Promise.all(itemsToWash.map(item =>
                fetch(`${API_BASE_URL}/api/items/${item.id}`, {
                    method: 'PUT',
                    headers: { ...authHeader, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...item, inLaundry: false })
                })
            ));
            setClothingItems(items => items.map(item => ({ ...item, inLaundry: false })));
        } catch (err) { console.error("Clear laundry error:", err); }
    };
    
    const deleteItem = async (itemId) => {
        try {
            await fetch(`${API_BASE_URL}/api/items/${itemId}`, { method: 'DELETE', headers: authHeader });
            setClothingItems(items => items.filter(item => item.id !== itemId));
        } catch (err) { console.error("Delete item error:", err); }
    };

    const getOutfitSuggestion = async (occasion) => {
        // This function remains the same as before
        setIsSuggesting(true);
        setOutfitSuggestion(null);
        setSuggestionError(null);
        const availableItems = clothingItems.filter(item => !item.inLaundry).map(({ name, category, subCategory, itemSize }) => ({ name, category, subCategory: subCategory || 'N/A', size: itemSize }));
        if (availableItems.length < 3) {
            setSuggestionError("You need at least a top, bottom, and shoes in your wardrobe to get a suggestion.");
            setIsSuggesting(false);
            return;
        }
        const prompt = `You are a fashion stylist. Based on the following available clothes, suggest a complete outfit for the occasion: "${occasion}". Please select one top, one bottom, and one pair of shoes. Optionally, you can also add one outerwear piece, one hat, and one watch. Available items: ${JSON.stringify(availableItems, null, 2)} Respond with only the JSON object containing the names of the selected items.`;
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory, generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { top: { type: "STRING" }, bottom: { type: "STRING" }, shoes: { type: "STRING" }, outerwear: { type: "STRING" }, hat: { type: "STRING" }, watch: { type: "STRING" } }, required: ["top", "bottom", "shoes"] } } };
        try {
            const apiKey = "";
            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(geminiApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API request failed`);
            const result = await response.json();
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const suggestion = JSON.parse(result.candidates[0].content.parts[0].text);
                const suggestedItems = { top: clothingItems.find(item => item.name === suggestion.top), bottom: clothingItems.find(item => item.name === suggestion.bottom), shoes: clothingItems.find(item => item.name === suggestion.shoes), outerwear: clothingItems.find(item => item.name === suggestion.outerwear) || null, hat: clothingItems.find(item => item.name === suggestion.hat) || null, watch: clothingItems.find(item => item.name === suggestion.watch) || null };
                setOutfitSuggestion(suggestedItems);
            } else { throw new Error("Could not parse suggestion."); }
        } catch (err) { setSuggestionError("Sorry, I couldn't come up with an outfit."); } finally { setIsSuggesting(false); }
    };

    return (
        <>
            <Header onAddItem={() => setIsAddModalOpen(true)} onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />
            <div className="flex">
                <FilterSidebar 
                    activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                    activeSubCategory={activeSubCategory} setActiveSubCategory={setActiveSubCategory}
                    isOpen={sidebarOpen} setIsOpen={setSidebarOpen}
                    clearLaundry={clearLaundry} laundryCount={clothingItems.filter(i => i.inLaundry).length}
                    onSuggestOutfit={() => setIsSuggestModalOpen(true)}
                />
                <MainContent 
                    items={filteredItems} activeCategory={activeCategory} 
                    onToggleLaundry={toggleLaundryStatus} onDeleteItem={deleteItem}
                    isLoading={isLoading} error={error} 
                />
            </div>
            {isAddModalOpen && <AddItemModal onClose={() => setIsAddModalOpen(false)} onAddItem={handleAddItem} />}
            {isSuggestModalOpen && <OutfitSuggesterModal onClose={() => { setIsSuggestModalOpen(false); setOutfitSuggestion(null); setSuggestionError(null); }} onReset={() => { setOutfitSuggestion(null); setSuggestionError(null); }} onSuggest={getOutfitSuggestion} suggestion={outfitSuggestion} isLoading={isSuggesting} error={suggestionError} />}
        </>
    );
}


// --- All other sub-components (Header, Sidebar, Cards, Modals, etc.) ---
// These components are mostly the same, with minor props changes.

const categories = [ 'T-Shirts', 'Shirts', 'Jackets', 'Hoodies', 'Pants', 'Sweatpants', 'Sweatshirts', 'Shorts', 'Underwear', 'Socks', 'Shoes', 'Hats', 'Belts', 'Watches', 'Sunglasses' ];
const subCategories = { 'T-Shirts': ['Everyday', 'Going Out'] };

function Header({ onAddItem, onMenuClick, onLogout }) {
    return (
        <header className="bg-white shadow-md sticky top-0 z-20"><div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16"><div className="flex items-center"><button onClick={onMenuClick} className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"><Shirt size={24} /></button><h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Digirobe</h1></div><div className="flex items-center gap-4"><button onClick={onAddItem} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><Plus size={20} /><span className="hidden sm:inline">Add New Item</span></button><button onClick={onLogout} title="Logout" className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-colors"><LogOut size={20}/></button></div></div></div></header>
    );
}

function FilterSidebar({ isOpen, setIsOpen, ...props }) {
    const { activeCategory, setActiveCategory, activeSubCategory, setActiveSubCategory, clearLaundry, laundryCount, onSuggestOutfit } = props;
    const handleCategoryClick = (category) => { setActiveCategory(category); if (window.innerWidth < 1024) setIsOpen(false); };
    const handleSubCategoryClick = (subCategory) => { setActiveSubCategory(subCategory); if (window.innerWidth < 1024) setIsOpen(false); };
    return (
        <><div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div><aside className={`fixed top-0 left-0 h-full bg-white shadow-xl z-40 w-72 transform transition-transform lg:transform-none lg:relative lg:w-72 lg:shadow-none lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}><div className="p-5 border-b border-gray-200 flex justify-between items-center"><h2 className="text-lg font-semibold text-gray-700">Categories</h2><button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-800"><X size={24} /></button></div><div className="h-[calc(100%-65px)] overflow-y-auto"><nav className="p-5 space-y-2"><button onClick={onSuggestOutfit} className="w-full text-left px-4 py-2 rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-sm"><Sparkles size={16}/> ✨ Suggest an Outfit</button><div className="border-t my-4"></div><FilterButton label="All" isActive={activeCategory === 'All'} onClick={() => handleCategoryClick('All')} /><FilterButton label="Laundry" icon={<WashingMachine size={16}/>} count={laundryCount} isActive={activeCategory === 'Laundry'} onClick={() => handleCategoryClick('Laundry')} /><div className="border-t my-4"></div>{categories.map(cat => (<FilterButton key={cat} label={cat} isActive={activeCategory === cat} onClick={() => handleCategoryClick(cat)} />))}</nav>{activeCategory === 'Laundry' && laundryCount > 0 && (<div className="p-5 border-t"><button onClick={clearLaundry} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-green-600 transition-colors"><WashingMachine size={20}/> Wash All Items</button></div>)}{subCategories[activeCategory]?.length > 0 && (<div className="p-5 border-t border-gray-200"><h3 className="text-md font-semibold text-gray-600 mb-3">Sub-categories for {activeCategory}</h3><div className="space-y-2"><FilterButton label="All" isActive={activeSubCategory === 'All'} onClick={() => handleSubCategoryClick('All')} isSub />{subCategories[activeCategory].map(subCat => (<FilterButton key={subCat} label={subCat} isActive={activeSubCategory === subCat} onClick={() => handleSubCategoryClick(subCat)} isSub />))}</div></div>)}</div></aside></>
    );
}

function FilterButton({ label, isActive, onClick, isSub = false, icon = null, count = 0 }) {
    const baseClasses = "w-full text-left px-4 py-2 rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-between";
    const activeClasses = isSub ? "bg-blue-100 text-blue-800" : "bg-blue-600 text-white";
    const inactiveClasses = "text-gray-600 hover:bg-gray-200 hover:text-gray-900";
    return (<button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}><div className="flex items-center gap-2">{icon}<span>{label}</span></div>{count > 0 && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-blue-600' : 'bg-gray-300 text-gray-700'}`}>{count}</span>}</button>);
}

function MainContent({ items, activeCategory, onToggleLaundry, onDeleteItem, isLoading, error }) {
    if (isLoading) return <div className="flex-1 p-8 text-center"><Spinner /> <p className="mt-2 text-gray-500">Loading your wardrobe...</p></div>;
    if (error) return <div className="flex-1 p-8 text-center text-red-500">Error: {error}</div>;
    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {items.map(item => <ClothingCard key={item.id} item={item} onToggleLaundry={onToggleLaundry} onDeleteItem={onDeleteItem} />)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 mt-20"><Shirt size={48} className="mb-4" /><h3 className="text-xl font-semibold">{activeCategory === 'Laundry' ? 'Laundry Basket is Empty!' : 'Your Wardrobe is Empty'}</h3><p className="max-w-sm mt-2">{activeCategory === 'Laundry' ? 'Great job staying on top of your chores.' : 'Click "Add New Item" to start building your collection.'}</p></div>
            )}
        </main>
    );
}

function ClothingCard({ item, onToggleLaundry, onDeleteItem }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col"><div className="relative"><img src={item.imageUrl} alt={item.name} className="w-full h-64 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x500/F3F4F6/999?text=Image+Error'; }}/><div className="absolute top-2 right-2"><button onClick={() => onToggleLaundry(item)} title={item.inLaundry ? 'Move to Wardrobe' : 'Move to Laundry'} className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-colors shadow-sm"><WashingMachine size={20} /></button></div></div><div className="p-4 flex-grow"><h3 className="text-lg font-semibold text-gray-800 truncate" title={item.name}>{item.name}</h3><div className="flex justify-between text-sm text-gray-500"><span>{item.brand}</span><span className="font-medium text-gray-600">Size: {item.itemSize}</span></div><p className="text-sm font-semibold text-gray-800 mt-1">${item.price.toFixed(2)}</p><div className="mt-3 pt-3 border-t border-gray-100 text-xs font-medium"><span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-gray-700 mr-2 mb-2">{item.category}</span>{item.subCategory && (<span className="inline-block bg-blue-100 rounded-full px-3 py-1 text-blue-800 mr-2 mb-2">{item.subCategory}</span>)}</div></div><div className="px-4 pb-3 pt-1 flex justify-end items-center"><div className="relative inline-block text-left" ref={menuRef}><button onClick={() => setIsMenuOpen(p => !p)} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><MoreVertical size={18} /></button>{isMenuOpen && (<div className="origin-bottom-right absolute right-0 bottom-full mb-2 w-56 bg-white rounded-md shadow-xl z-10 ring-1 ring-black ring-opacity-5 focus:outline-none"><div className="py-1"><button onClick={() => { onDeleteItem(item.id); setIsMenuOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 className="mr-3 h-5 w-5" /><span>Delete Permanently</span></button></div></div>)}</div></div></div>
    );
}

function AddItemModal({ onClose, onAddItem }) {
    const [formData, setFormData] = useState({ name: '', brand: '', price: '', category: categories[0], subCategory: '', itemSize: '', imageUrl: '', inLaundry: false });
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = React.useRef(null);
    const handleInputChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setImagePreview(reader.result); setFormData(p => ({ ...p, imageUrl: reader.result })); }; reader.readAsDataURL(file); } };
    const handleSubmit = (e) => { e.preventDefault(); const price = parseFloat(formData.price); if (!formData.name || !formData.brand || isNaN(price)) return; onAddItem({ ...formData, price, subCategory: subCategories[formData.category] ? formData.subCategory : null }); };
    return (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-full overflow-y-auto"><div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800">Add Item</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="flex items-center gap-4"><div className="w-28 h-28 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed">{imagePreview ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-md"/> : <Shirt className="text-gray-400" size={40}/>}</div><div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label><input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef}/><button type="button" onClick={() => fileInputRef.current.click()} className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Upload Image</button></div></div><InputField label="Item Name" name="name" value={formData.name} onChange={handleInputChange} required /><div className="grid grid-cols-2 gap-4"><InputField label="Brand" name="brand" value={formData.brand} onChange={handleInputChange} required /><InputField label="Size" name="itemSize" value={formData.itemSize} onChange={handleInputChange} placeholder="e.g., M, 32x30, 10.5" required /></div><InputField label="Price" name="price" type="number" value={formData.price} onChange={handleInputChange} required /><div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>{subCategories[formData.category]?.length > 0 && (<div><label className="block text-sm font-medium text-gray-700 mb-1">Sub-category</label><select name="subCategory" value={formData.subCategory} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">None</option>{subCategories[formData.category].map(subCat => <option key={subCat} value={subCat}>{subCat}</option>)}</select></div>)}<div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">Add Item</button></div></form></div></div>);
}

function InputField({ label, name, type = 'text', value, onChange, required = false, placeholder = '' }) {
    return (<div><label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type={type} id={name} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /></div>);
}

function OutfitSuggesterModal({ onClose, onSuggest, suggestion, isLoading, error, onReset }) {
    const [occasion, setOccasion] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); if (occasion.trim()) onSuggest(occasion); };
    return (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto"><div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Sparkles className="text-purple-500" /> AI Outfit Suggester</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><div className="p-6">{!suggestion && (<form onSubmit={handleSubmit}><label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-2">What's the occasion?</label><input type="text" id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="e.g., Casual weekend brunch, formal wedding..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" disabled={isLoading}/><div className="mt-4 flex justify-end"><button type="submit" className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-purple-700 transition-colors disabled:bg-purple-300" disabled={isLoading || !occasion.trim()}>{isLoading ? <Spinner /> : <><Wand2 size={18}/> Get Suggestion</>}</button></div></form>)}{isLoading && !suggestion && (<div className="text-center py-8"><p className="text-gray-600">✨ Your personal stylist is thinking...</p></div>)}{error && <div className="mt-4 text-center text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}{suggestion && (<div className="animate-fade-in"><h3 className="text-lg font-semibold text-center text-gray-800 mb-4">Here's an outfit idea for "{occasion}":</h3><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{suggestion.top && <SuggestionCard item={suggestion.top} type="Top" />}{suggestion.bottom && <SuggestionCard item={suggestion.bottom} type="Bottom" />}{suggestion.shoes && <SuggestionCard item={suggestion.shoes} type="Shoes" />}{suggestion.outerwear && <SuggestionCard item={suggestion.outerwear} type="Outerwear" />}{suggestion.hat && <SuggestionCard item={suggestion.hat} type="Hat" />}{suggestion.watch && <SuggestionCard item={suggestion.watch} type="Watch" />}</div><div className="mt-6 flex justify-end"><button onClick={() => { onReset(); setOccasion(''); }} className="flex items-center justify-center gap-2 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors" disabled={isLoading}>Try another occasion</button></div></div>)}</div></div></div>);
}

function SuggestionCard({ item, type }) {
    if (!item) return null;
    return (<div className="border rounded-lg p-2 text-center bg-gray-50 flex flex-col justify-between"><p className="font-bold text-gray-500 text-xs mb-2">{type}</p><div><img src={item.imageUrl} alt={item.name} className="w-full h-24 object-cover rounded-md shadow-sm" /></div><div className="mt-2"><h4 className="font-semibold text-gray-900 text-xs leading-tight">{item.name}</h4><p className="text-xs text-gray-500">{item.brand}</p></div></div>);
}

function Spinner() {
    return (<svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
}
