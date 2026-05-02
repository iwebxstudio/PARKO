const express = require('express');
const cors = require('cors');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;

app.post('/print', async (req, res) => {
  const { ticket, printerConfig } = req.body;
  
  if (!ticket) {
    return res.status(400).json({ error: 'Missing ticket data' });
  }

  // Default configuration
  const pType = printerConfig?.type === 'usb' ? PrinterTypes.EPSON : PrinterTypes.STAR;
  const pInterface = printerConfig?.interface || 'printer:Auto'; // Use OS default or explicit interface like "tcp://192.168.1.100" or "\\\\.\\LPT1"
  const pWidth = printerConfig?.paperWidth === 80 ? 48 : 42; // Characters per line

  try {
    let printer = new ThermalPrinter({
      type: pType,
      interface: pInterface,
      characterSet: 'PC858_EURO',
      removeSpecialCharacters: false,
      lineCharacter: '=',
      options: {
        timeout: 5000
      }
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.warn('Printer not connected! Simulating print...');
      // In development, we simulate the print to avoid crashing
    }

    printer.alignCenter();
    printer.println('PARKO PARKING SYSTEM');
    printer.drawLine();
    
    printer.alignLeft();
    printer.println(`Ticket: ${ticket.ticketNumber}`);
    printer.println(`Type:   ${ticket.vehicleType?.label || 'Vehicle'}`);
    printer.println(`Plate:  ${ticket.plateNumber || 'N/A'}`);
    printer.println(`In:     ${new Date(ticket.checkInAt).toLocaleString()}`);
    
    if (ticket.checkOutAt) {
      printer.println(`Out:    ${new Date(ticket.checkOutAt).toLocaleString()}`);
      printer.println(`Time:   ${ticket.duration?.formatted || ''}`);
      printer.drawLine();
      printer.alignRight();
      printer.println(`TOTAL: ${new Intl.NumberFormat('lo-LA').format(ticket.totalAmount || ticket.calculatedCost || 0)} LAK`);
      if (ticket.paymentStatus) {
        printer.println(`Status: ${ticket.paymentStatus}`);
      }
    } else {
      printer.drawLine();
      printer.alignCenter();
      printer.printQR(ticket.ticketNumber);
    }
    
    printer.drawLine();
    printer.alignCenter();
    printer.println('Thank you for using our service');
    printer.cut();

    if (isConnected) {
      await printer.execute();
      console.log(`Printed receipt for ticket: ${ticket.ticketNumber}`);
    } else {
      console.log(`Simulated print for ticket: ${ticket.ticketNumber}`);
    }

    res.status(200).json({ success: true, message: 'Print job executed' });
  } catch (error) {
    console.error('Print Error:', error);
    res.status(500).json({ error: 'Failed to print receipt', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🖨️  PARKO Local Print Agent running on http://localhost:${PORT}`);
  console.log(`Ready to receive print jobs via POST /print`);
});
