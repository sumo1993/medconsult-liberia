# Location Dropdowns Fix

The profile page got corrupted during the edit. Here's what needs to be done:

## Replace the Country/County/City section with:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Country
    </label>
    <select
      value={profileData.country}
      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
    >
      <option value="">Select country...</option>
      <option value="Liberia">Liberia</option>
      <option value="Sierra Leone">Sierra Leone</option>
      <option value="Guinea">Guinea</option>
      <option value="Côte d'Ivoire">Côte d'Ivoire</option>
      <option value="Ghana">Ghana</option>
      <option value="Nigeria">Nigeria</option>
      <option value="Other">Other</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      County
    </label>
    <select
      value={profileData.county}
      onChange={(e) => setProfileData({ ...profileData, county: e.target.value, city: '' })}
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
    >
      <option value="">Select county...</option>
      <option value="Bomi">Bomi</option>
      <option value="Bong">Bong</option>
      <option value="Gbarpolu">Gbarpolu</option>
      <option value="Grand Bassa">Grand Bassa</option>
      <option value="Grand Cape Mount">Grand Cape Mount</option>
      <option value="Grand Gedeh">Grand Gedeh</option>
      <option value="Grand Kru">Grand Kru</option>
      <option value="Lofa">Lofa</option>
      <option value="Margibi">Margibi</option>
      <option value="Maryland">Maryland</option>
      <option value="Montserrado">Montserrado</option>
      <option value="Nimba">Nimba</option>
      <option value="River Cess">River Cess</option>
      <option value="River Gee">River Gee</option>
      <option value="Sinoe">Sinoe</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      City/Town
    </label>
    <select
      value={profileData.city}
      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
      disabled={!profileData.county}
    >
      <option value="">Select city...</option>
      {profileData.county === 'Montserrado' && (
        <>
          <option value="Monrovia">Monrovia</option>
          <option value="Paynesville">Paynesville</option>
          <option value="Congo Town">Congo Town</option>
          <option value="New Kru Town">New Kru Town</option>
          <option value="Sinkor">Sinkor</option>
        </>
      )}
      {profileData.county === 'Bong' && (
        <>
          <option value="Gbarnga">Gbarnga</option>
          <option value="Totota">Totota</option>
        </>
      )}
      {profileData.county === 'Nimba' && (
        <>
          <option value="Sanniquellie">Sanniquellie</option>
          <option value="Ganta">Ganta</option>
          <option value="Tappita">Tappita</option>
        </>
      )}
      {profileData.county && (
        <option value="Other">Other</option>
      )}
    </select>
    {!profileData.county && (
      <p className="text-xs text-gray-500 mt-1">Select a county first</p>
    )}
  </div>
</div>
```

## Features:
- Country dropdown with West African countries
- All 15 Liberian counties
- Cities dynamically shown based on selected county
- City dropdown disabled until county is selected
- "Other" option for unlisted cities

The file needs to be manually fixed or restored from backup.
