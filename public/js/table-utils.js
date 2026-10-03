window.exportToCSV = function(data, filename) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] !== null && row[header] !== undefined ? String(row[header]) : '';
      return '"' + val.replace(/"/g, '""') + '"';
    });
    csvRows.push(values.join(','));
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

window.renderPaginatedTable = function(panelId, data, renderRow, columnsHtml, title, exportName, headerActionsHtml = '') {
  let currentPage = 1;
  const itemsPerPage = 7;

  function updateView() {
    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(start, start + itemsPerPage);

    const tableRows = paginatedData.length === 0 
      ? '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-400">No records found.</td></tr>'
      : paginatedData.map(renderRow).join('');

    const html = `
      <div class="bg-[#FAF7F2] rounded-2xl p-6 border border-[#DDD5C8]">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold text-[#1A1D20]">${title} <span class="text-sm font-normal text-gray-500">(${data.length})</span></h2>
          <div class="flex gap-2">
            ${headerActionsHtml}
            <button id="btn-export-csv" class="px-3 py-1.5 text-xs font-semibold bg-white border border-[#DDD5C8] rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export CSV
            </button>
            <input type="text" placeholder="Search..." class="px-3 py-1.5 text-xs border border-gray-300 rounded-lg">
          </div>
        </div>
        <div class="bg-white border border-[#E8E0D4] rounded-xl overflow-hidden shadow-xs">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-[#F8F6F0] text-xs uppercase font-bold text-gray-500 border-b border-[#E8E0D4]">
              <tr>${columnsHtml}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        
        <!-- Pagination Controls -->
        <div class="mt-4 pt-3 border-t border-[#E8E0D4] flex items-center justify-between text-xs text-gray-500">
          <span>Showing ${data.length === 0 ? 0 : start + 1} to ${Math.min(start + itemsPerPage, data.length)} of ${data.length} records</span>
          <div class="flex items-center gap-1">
            <button id="btn-prev-page" class="px-2.5 py-1 rounded border border-[#DCD3C2] bg-[#FAF7F2] hover:bg-white text-gray-600 font-medium disabled:opacity-50" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <button class="px-2.5 py-1 rounded border border-[#DCD3C2] bg-white text-[#AA820A] font-bold">${currentPage} / ${totalPages}</button>
            <button id="btn-next-page" class="px-2.5 py-1 rounded border border-[#DCD3C2] bg-[#FAF7F2] hover:bg-white text-gray-600 font-medium disabled:opacity-50" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>
    `;

    const panel = document.getElementById(panelId);
    if (panel) {
      panel.innerHTML = html;
      
      // Bind Export
      panel.querySelector('#btn-export-csv').addEventListener('click', () => {
        window.exportToCSV(data, exportName);
      });
      
      // Bind Pagination
      const prevBtn = panel.querySelector('#btn-prev-page');
      if (prevBtn) prevBtn.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; updateView(); }
      });
      
      const nextBtn = panel.querySelector('#btn-next-page');
      if (nextBtn) nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) { currentPage++; updateView(); }
      });
    }
  }

  updateView();
};
