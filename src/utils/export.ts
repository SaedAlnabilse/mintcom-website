/**
 * Utility to export an array of objects to a Csv file and trigger a download.
 * @param data Array of objects representing the rows.
 * @param filename Desired filename (without extension).
 * @param headers Optional custom headers mapping (e.g., { id: 'Id', name: 'Name' }).
 */
export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
  if (!data || data.length === 0) {
    return;
  }

  // Determine keys from the first object if headers aren't provided
  const keys = Object.keys(data[0]);
  
  // Create header row
  const headerRow = headers 
    ? Object.values(headers).join(',')
    : keys.join(',');

  // Create data rows
  const rows = data.map(obj => {
    const values = (headers ? Object.keys(headers) : keys).map(key => {
      let value = obj[key];
      
      // Handle nested objects (simple flatten)
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Just use the name or username if it exists
        value = value.name || value.username || JSON.stringify(value);
      }

      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value ?? '').replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    return values.join(',');
  });

  // Combine and create blob
  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Trigger download
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
