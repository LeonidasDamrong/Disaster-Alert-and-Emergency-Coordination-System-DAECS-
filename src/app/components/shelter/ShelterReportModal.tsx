import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ShelterReportApi } from '../../lib/types';

interface ShelterReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: ShelterReportApi | null;
}

export function ShelterReportModal({ open, onOpenChange, report }: ShelterReportModalProps) {
    if (!report) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('shelter-generated-report-print');
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
      <html>
        <head>
          <title>Shelter Status Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { margin-bottom: 5px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .meta { color: #666; margin-bottom: 30px; font-style: italic; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { font-weight: bold; }
            .value { }
            .box { background: #f9f9f9; padding: 16px; border-radius: 4px; border: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>Shelter Status Report</h1>
          <p class="meta">Generated Report ID: ${report.shelterReportId} | Date: ${format(new Date(report.generatedAt), 'PPpp')}</p>
          
          <div class="section">
            <div class="section-title">Shelter Details</div>
            <div class="row"><span class="label">Shelter Name:</span> <span class="value">${report.name}</span></div>
            <div class="row"><span class="label">Location:</span> <span class="value">${report.location}</span></div>
            <div class="row"><span class="label">Status:</span> <span class="value">${report.status}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Capacity & Occupancy</div>
            <div class="row"><span class="label">Total Capacity:</span> <span class="value">${report.totalCapacity}</span></div>
            <div class="row"><span class="label">Available Capacity:</span> <span class="value">${report.availableCapacity}</span></div>
            <div class="row"><span class="label">Current Occupancy:</span> <span class="value">${report.totalCapacity - report.availableCapacity}</span></div>
            <div class="row"><span class="label">Occupancy Rate:</span> <span class="value">${Math.round(((report.totalCapacity - report.availableCapacity) / report.totalCapacity) * 100)}%</span></div>
          </div>

          <div class="section">
            <div class="section-title">Resource Summary</div>
            <div class="box">
              ${report.resourceSummary || "No resources recorded."}
            </div>
          </div>
        </body>
      </html>
    `);
        doc.close();

        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        }, 500);
    };

    const handleDownload = () => {
        const headers = ['Shelter Name', 'Location', 'Status', 'Total Capacity', 'Available Capacity', 'Occupancy', 'Resources'];
        const values = [
            report.name,
            report.location,
            report.status,
            report.totalCapacity,
            report.availableCapacity,
            report.totalCapacity - report.availableCapacity,
            report.resourceSummary || 'None'
        ];

        const csvContent = "data:text/csv;charset=utf-8," +
            [headers.join(','), values.map(v => `"${v}"`).join(',')].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `shelter_report_${report.shelterReportId}_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Shelter Status Report</DialogTitle>
                    <DialogDescription>Snapshot of shelter status, capacity, and resources.</DialogDescription>
                </DialogHeader>

                <div id="shelter-generated-report-print" className="space-y-6 py-4 flex-1 min-h-0 overflow-y-auto scrollbar-dialog">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Shelter Name</p>
                            <p className="font-semibold">{report.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Location</p>
                            <p>{report.location}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <p>{report.status}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Generated At</p>
                            <p>{format(new Date(report.generatedAt), 'PP p')}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <h4 className="font-medium text-sm text-gray-900 border-b pb-2 mb-2">Capacity & Occupancy</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Capacity:</span>
                            <span className="font-medium">{report.totalCapacity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Available:</span>
                            <span className="font-medium">{report.availableCapacity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Current Occupancy:</span>
                            <span className="font-medium">{report.totalCapacity - report.availableCapacity}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Resource Summary</h4>
                        <div className="text-sm text-gray-600 p-3 border rounded bg-white">
                            {report.resourceSummary || "No resources recorded."}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                        Download CSV
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
