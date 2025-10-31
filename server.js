const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const os = require('os');
const bonjour = require('bonjour')();
const { Client } = require('node-ssdp');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let iface of Object.values(interfaces)) {
    for (let alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '192.168.1.1';
}

// Common MAC vendor prefixes (OUI database subset)
const macVendors = {
  '00:03:93': 'Apple',
  '00:0a:95': 'Apple',
  '00:0d:93': 'Apple',
  '00:17:f2': 'Apple',
  '00:1b:63': 'Apple',
  '00:1c:b3': 'Apple',
  '00:1e:52': 'Apple',
  '00:1f:5b': 'Apple',
  '00:1f:f3': 'Apple',
  '00:21:e9': 'Apple',
  '00:22:41': 'Apple',
  '00:23:12': 'Apple',
  '00:23:32': 'Apple',
  '00:23:6c': 'Apple',
  '00:23:df': 'Apple',
  '00:24:36': 'Apple',
  '00:25:00': 'Apple',
  '00:25:4b': 'Apple',
  '00:25:bc': 'Apple',
  '00:26:08': 'Apple',
  '00:26:4a': 'Apple',
  '00:26:b0': 'Apple',
  '00:26:bb': 'Apple',
  '00:3e:e1': 'Apple',
  '00:50:e4': 'Apple',
  '00:61:71': 'Apple',
  '00:88:65': 'Apple',
  '00:c6:10': 'Apple',
  '00:d:93': 'Apple',
  '04:0c:ce': 'Apple',
  '04:15:52': 'Apple',
  '04:26:65': 'Apple',
  '04:48:9a': 'Apple',
  '04:4b:ed': 'Apple',
  '04:54:53': 'Apple',
  '04:69:f8': 'Apple',
  '04:d3:cf': 'Apple',
  '04:db:56': 'Apple',
  '04:e5:36': 'Apple',
  '04:f1:3e': 'Apple',
  '04:f7:e4': 'Apple',
  '08:00:07': 'Apple',
  '08:6d:41': 'Apple',
  '08:70:45': 'Apple',
  '08:74:02': 'Apple',
  '0c:3e:9f': 'Apple',
  '0c:4d:e9': 'Apple',
  '0c:71:5d': 'Apple',
  '0c:74:c2': 'Apple',
  '10:00:00': 'Cisco',
  '10:0d:7f': 'Ubiquiti',
  '10:40:f3': 'Apple',
  '10:41:7f': 'Apple',
  '10:9a:dd': 'Apple',
  '10:dd:b1': 'Apple',
  '14:10:9f': 'Apple',
  '14:20:5e': 'Apple',
  '14:5a:05': 'Apple',
  '14:7d:da': 'Apple',
  '14:8f:c6': 'Apple',
  '14:98:77': 'Apple',
  '14:bd:61': 'Apple',
  '18:20:32': 'Apple',
  '18:34:51': 'Apple',
  '18:3d:a2': 'Apple',
  '18:60:24': 'Apple',
  '18:81:0e': 'Apple',
  '18:af:8f': 'Apple',
  '18:e7:f4': 'Apple',
  '1c:1a:c0': 'Apple',
  '1c:36:bb': 'Apple',
  '1c:9e:cc': 'Apple',
  '1c:ab:a7': 'Apple',
  '1c:e6:2b': 'Apple',
  '20:3c:ae': 'Apple',
  '20:78:f0': 'Apple',
  '20:a2:e4': 'Apple',
  '20:ab:37': 'Apple',
  '20:c9:d0': 'Apple',
  '24:a0:74': 'Apple',
  '24:a2:e1': 'Apple',
  '24:ab:81': 'Apple',
  '24:da:9b': 'Apple',
  '24:f0:94': 'Apple',
  '24:f6:77': 'Apple',
  '28:37:37': 'Apple',
  '28:6a:b8': 'Apple',
  '28:a0:2b': 'Apple',
  '28:cf:da': 'Apple',
  '28:cf:e9': 'Apple',
  '28:e1:4c': 'Apple',
  '2c:1f:23': 'Apple',
  '2c:33:7a': 'Apple',
  '2c:3a:fd': 'Apple',
  '2c:be:08': 'Apple',
  '2c:d0:2d': 'Apple',
  '30:35:ad': 'Apple',
  '30:90:ab': 'Apple',
  '30:f7:c5': 'Apple',
  '34:15:9e': 'Apple',
  '34:36:3b': 'Apple',
  '34:a3:95': 'Apple',
  '34:c0:59': 'Apple',
  '34:e2:fd': 'Apple',
  '38:0f:4a': 'Apple',
  '38:48:4c': 'Apple',
  '38:89:2c': 'Apple',
  '38:b5:4d': 'Apple',
  '38:c9:86': 'Apple',
  '38:ca:da': 'Apple',
  '3c:07:54': 'Apple',
  '3c:15:c2': 'Apple',
  '3c:2e:f9': 'Apple',
  '3c:d0:f8': 'Apple',
  '40:30:04': 'Apple',
  '40:33:1a': 'Apple',
  '40:3c:fc': 'Apple',
  '40:4d:7f': 'Apple',
  '40:6c:8f': 'Apple',
  '40:a6:d9': 'Apple',
  '40:b3:95': 'Apple',
  '40:cb:c0': 'Apple',
  '44:2a:60': 'Apple',
  '44:4c:0c': 'Apple',
  '44:d8:84': 'Apple',
  '48:43:7c': 'Apple',
  '48:74:6e': 'Apple',
  '48:a1:95': 'Apple',
  '48:bf:6b': 'Apple',
  '48:d7:05': 'Apple',
  '4c:32:75': 'Apple',
  '4c:57:ca': 'Apple',
  '4c:74:bf': 'Apple',
  '4c:7c:5f': 'Apple',
  '4c:8d:79': 'Apple',
  '4c:b1:99': 'Apple',
  '50:32:37': 'Apple',
  '50:a6:7f': 'Apple',
  '54:26:96': 'Apple',
  '54:72:4f': 'Apple',
  '54:9f:13': 'Apple',
  '54:ae:27': 'Apple',
  '54:ea:a8': 'Apple',
  '58:40:4e': 'Apple',
  '58:55:ca': 'Apple',
  '58:b0:35': 'Apple',
  '5c:59:48': 'Apple',
  '5c:8d:4e': 'Apple',
  '5c:95:ae': 'Apple',
  '5c:96:9d': 'Apple',
  '5c:97:f3': 'Apple',
  '5c:f9:38': 'Apple',
  '60:03:08': 'Apple',
  '60:33:4b': 'Apple',
  '60:69:44': 'Apple',
  '60:8c:4a': 'Apple',
  '60:c5:47': 'Apple',
  '60:d9:c7': 'Apple',
  '60:f8:1d': 'Apple',
  '60:fa:cd': 'Apple',
  '60:fb:42': 'Apple',
  '64:20:0c': 'Apple',
  '64:76:ba': 'Apple',
  '64:a3:cb': 'Apple',
  '64:b9:e8': 'Apple',
  '64:e6:82': 'Apple',
  '68:09:27': 'Apple',
  '68:5b:35': 'Apple',
  '68:96:7b': 'Apple',
  '68:a8:6d': 'Apple',
  '68:ae:20': 'Apple',
  '68:d9:3c': 'Apple',
  '68:db:f5': 'Apple',
  '6c:19:c0': 'Apple',
  '6c:3e:6d': 'Apple',
  '6c:40:08': 'Apple',
  '6c:4d:73': 'Apple',
  '6c:70:9f': 'Apple',
  '6c:72:20': 'Apple',
  '6c:94:66': 'Apple',
  '6c:96:cf': 'Apple',
  '70:11:24': 'Apple',
  '70:14:a6': 'Apple',
  '70:48:0f': 'Apple',
  '70:56:81': 'Apple',
  '70:73:cb': 'Apple',
  '70:cd:60': 'Apple',
  '70:de:e2': 'Apple',
  '70:ec:e4': 'Apple',
  '74:1b:b2': 'Apple',
  '74:81:14': 'Apple',
  '74:e1:b6': 'Apple',
  '74:e2:f5': 'Apple',
  '78:31:c1': 'Apple',
  '78:3a:84': 'Apple',
  '78:7b:8a': 'Apple',
  '78:88:6d': 'Apple',
  '78:a3:e4': 'Apple',
  '78:ca:39': 'Apple',
  '78:d7:5f': 'Apple',
  '78:fd:94': 'Apple',
  '7c:01:91': 'Apple',
  '7c:04:d0': 'Apple',
  '7c:11:be': 'Apple',
  '7c:6d:62': 'Apple',
  '7c:6d:f8': 'Apple',
  '7c:7a:91': 'Apple',
  '7c:c3:a1': 'Apple',
  '7c:c5:37': 'Apple',
  '7c:d1:c3': 'Apple',
  '7c:f0:5f': 'Apple',
  '80:49:71': 'Apple',
  '80:92:9f': 'Apple',
  '80:be:05': 'Apple',
  '80:e6:50': 'Apple',
  '80:ea:96': 'Apple',
  '84:38:35': 'Apple',
  '84:78:8b': 'Apple',
  '84:85:06': 'Apple',
  '84:89:ad': 'Apple',
  '84:8e:0c': 'Apple',
  '84:fc:fe': 'Apple',
  '88:1f:a1': 'Apple',
  '88:53:95': 'Apple',
  '88:63:df': 'Apple',
  '88:66:5a': 'Apple',
  '88:c6:63': 'Apple',
  '88:e8:7f': 'Apple',
  '8c:00:6d': 'Apple',
  '8c:29:37': 'Apple',
  '8c:2d:aa': 'Apple',
  '8c:58:77': 'Apple',
  '8c:7b:9d': 'Apple',
  '8c:7c:92': 'Apple',
  '8c:85:90': 'Apple',
  '8c:8e:f2': 'Apple',
  '90:27:e4': 'Apple',
  '90:72:40': 'Apple',
  '90:84:0d': 'Apple',
  '90:8d:6c': 'Apple',
  '90:9a:4a': 'Apple',
  '90:b0:ed': 'Apple',
  '90:b2:1f': 'Apple',
  '94:0c:6d': 'Apple',
  '94:94:26': 'Apple',
  '94:e9:6a': 'Apple',
  '94:f6:a3': 'Apple',
  '98:01:a7': 'Apple',
  '98:03:d8': 'Apple',
  '98:5a:eb': 'Apple',
  '98:d6:bb': 'Apple',
  '98:e0:d9': 'Apple',
  '98:f0:ab': 'Apple',
  '9c:04:eb': 'Apple',
  '9c:20:7b': 'Apple',
  '9c:35:5b': 'Apple',
  '9c:84:bf': 'Apple',
  '9c:f4:8e': 'Apple',
  'a0:3b:e3': 'Apple',
  'a0:56:f3': 'Apple',
  'a0:99:9b': 'Apple',
  'a0:d7:95': 'Apple',
  'a0:ed:cd': 'Apple',
  'a4:5e:60': 'Apple',
  'a4:67:06': 'Apple',
  'a4:83:e7': 'Apple',
  'a4:b1:97': 'Apple',
  'a4:c3:61': 'Apple',
  'a4:cf:99': 'Apple',
  'a4:d1:8c': 'Apple',
  'a8:20:66': 'Apple',
  'a8:5b:78': 'Apple',
  'a8:66:7f': 'Apple',
  'a8:86:dd': 'Apple',
  'a8:96:75': 'Apple',
  'a8:be:27': 'Apple',
  'a8:fa:d8': 'Apple',
  'ac:1f:74': 'Apple',
  'ac:29:3a': 'Apple',
  'ac:3c:0b': 'Apple',
  'ac:61:75': 'Apple',
  'ac:7f:3e': 'Apple',
  'ac:87:a3': 'Apple',
  'ac:bc:32': 'Apple',
  'ac:cf:5c': 'Apple',
  'ac:fd:ce': 'Apple',
  'b0:34:95': 'Apple',
  'b0:65:bd': 'Apple',
  'b0:9f:ba': 'Apple',
  'b0:ca:68': 'Apple',
  'b4:18:d1': 'Apple',
  'b4:8b:19': 'Apple',
  'b4:f0:ab': 'Apple',
  'b4:f6:1c': 'Apple',
  'b8:09:8a': 'Apple',
  'b8:17:c2': 'Apple',
  'b8:41:a4': 'Apple',
  'b8:44:d9': 'Apple',
  'b8:53:ac': 'Apple',
  'b8:63:4d': 'Apple',
  'b8:78:26': 'Apple',
  'b8:82:fe': 'Apple',
  'b8:8d:12': 'Apple',
  'b8:c1:11': 'Apple',
  'b8:c7:5d': 'Apple',
  'b8:e8:56': 'Apple',
  'b8:f6:b1': 'Apple',
  'b8:ff:61': 'Apple',
  'bc:3a:ea': 'Apple',
  'bc:52:b7': 'Apple',
  'bc:67:1c': 'Apple',
  'bc:6c:21': 'Apple',
  'bc:92:6b': 'Apple',
  'bc:9f:ef': 'Apple',
  'bc:d0:74': 'Apple',
  'bc:ec:5d': 'Apple',
  'c0:1a:da': 'Apple',
  'c0:63:94': 'Apple',
  'c0:84:7d': 'Apple',
  'c0:9f:42': 'Apple',
  'c0:b6:58': 'Apple',
  'c0:cc:f8': 'Apple',
  'c0:ce:cd': 'Apple',
  'c0:d0:12': 'Apple',
  'c4:2c:03': 'Apple',
  'c4:61:8b': 'Apple',
  'c4:b3:01': 'Apple',
  'c8:2a:14': 'Apple',
  'c8:33:4b': 'Apple',
  'c8:69:cd': 'Apple',
  'c8:6f:1d': 'Apple',
  'c8:85:50': 'Apple',
  'c8:89:f3': 'Apple',
  'c8:bc:c8': 'Apple',
  'c8:d0:83': 'Apple',
  'c8:e0:eb': 'Apple',
  'cc:08:e0': 'Apple',
  'cc:20:e8': 'Apple',
  'cc:25:ef': 'Apple',
  'cc:29:f5': 'Apple',
  'cc:2d:b7': 'Apple',
  'cc:2d:e0': 'Apple',
  'cc:44:63': 'Apple',
  'cc:78:5f': 'Apple',
  'cc:c7:60': 'Apple',
  'd0:03:4b': 'Apple',
  'd0:23:db': 'Apple',
  'd0:25:98': 'Apple',
  'd0:33:11': 'Apple',
  'd0:4f:7e': 'Apple',
  'd0:81:7a': 'Apple',
  'd0:a6:37': 'Apple',
  'd0:c5:f3': 'Apple',
  'd0:d2:b0': 'Apple',
  'd0:e1:40': 'Apple',
  'd4:61:da': 'Apple',
  'd4:85:64': 'Apple',
  'd4:90:9c': 'Apple',
  'd4:9a:20': 'Apple',
  'd4:a3:3d': 'Apple',
  'd4:dc:cd': 'Apple',
  'd4:f4:6f': 'Apple',
  'd8:00:4d': 'Apple',
  'd8:30:62': 'Apple',
  'd8:9e:3f': 'Apple',
  'd8:a2:5e': 'Apple',
  'd8:bb:2c': 'Apple',
  'd8:cf:9c': 'Apple',
  'd8:d1:cb': 'Apple',
  'dc:0c:2d': 'Apple',
  'dc:2b:2a': 'Apple',
  'dc:2b:61': 'Apple',
  'dc:37:18': 'Apple',
  'dc:3b:a9': 'Apple',
  'dc:56:e7': 'Apple',
  'dc:86:d8': 'Apple',
  'dc:9b:9c': 'Apple',
  'dc:a4:ca': 'Apple',
  'dc:a9:04': 'Apple',
  'dc:c3:95': 'Apple',
  'dc:e4:cc': 'Apple',
  'e0:05:c5': 'Apple',
  'e0:0': 'Apple',
  'e0:2a:82': 'Apple',
  'e0:66:78': 'Apple',
  'e0:88:5d': 'Apple',
  'e0:89:7e': 'Apple',
  'e0:ac:cb': 'Apple',
  'e0:b5:2d': 'Apple',
  'e0:b9:a5': 'Apple',
  'e0:b9:e5': 'Apple',
  'e0:c7:67': 'Apple',
  'e0:c9:7a': 'Apple',
  'e0:f5:c6': 'Apple',
  'e0:f8:47': 'Apple',
  'e4:25:e7': 'Apple',
  'e4:8b:7f': 'Apple',
  'e4:98:d6': 'Apple',
  'e4:9a:79': 'Apple',
  'e4:c6:3d': 'Apple',
  'e4:ce:8f': 'Apple',
  'e8:04:0b': 'Apple',
  'e8:06:88': 'Apple',
  'e8:2a:ea': 'Apple',
  'e8:40:40': 'Apple',
  'e8:80:2e': 'Apple',
  'e8:8d:28': 'Apple',
  'ec:35:86': 'Apple',
  'ec:85:2f': 'Apple',
  'f0:18:98': 'Apple',
  'f0:24:75': 'Apple',
  'f0:2f:74': 'Apple',
  'f0:61:c8': 'Apple',
  'f0:76:6f': 'Apple',
  'f0:98:9d': 'Apple',
  'f0:b0:e7': 'Apple',
  'f0:b4:79': 'Apple',
  'f0:c1:f1': 'Apple',
  'f0:cb:a1': 'Apple',
  'f0:d1:a9': 'Apple',
  'f0:db:e2': 'Apple',
  'f0:dc:e2': 'Apple',
  'f0:db:f8': 'Apple',
  'f4:0f:24': 'Apple',
  'f4:1b:a1': 'Apple',
  'f4:37:b7': 'Apple',
  'f4:5c:89': 'Apple',
  'f4:8b:32': 'Apple',
  'f4:f1:5a': 'Apple',
  'f4:f9:51': 'Apple',
  'f8:1e:df': 'Apple',
  'f8:27:93': 'Apple',
  'f8:2d:7c': 'Apple',
  'f8:62:14': 'Apple',
  'f8:95:c7': 'Apple',
  'f8:d0:ac': 'Apple',
  'fc:25:3f': 'Apple',
  'fc:a1:3e': 'Apple',
  'fc:d8:48': 'Apple',
  'fc:e9:98': 'Apple',
  'fc:fc:48': 'Apple',
  '00:11:32': 'Synology',
  '90:09:d0': 'Synology',
  '48:31:b7': 'Bambu Lab',
  '3c:84:27': 'Espressif (ESP32)',
  '24:58:7c': 'Espressif (ESP32)',
  'e4:b0:63': 'Espressif (ESP32)',
  '24:0a:c4': 'Espressif (ESP32)',
  '30:ae:a4': 'Espressif (ESP32)',
  '00:1a:11': 'TP-Link',
  '00:24:8c': 'Samsung',
  '00:27:10': 'Samsung',
  '00:0c:29': 'VMware',
  '00:15:5d': 'Microsoft',
  '00:1b:44': 'Dell',
  '00:14:22': 'Dell',
  '18:db:f2': 'Dell',
  '34:17:eb': 'Dell',
  '50:9a:4c': 'Dell',
  'b0:83:fe': 'Dell',
  'd0:67:e5': 'Dell',
  'e0:db:55': 'Dell',
  'f0:1f:af': 'Dell',
  '00:1b:21': 'Intel',
  '00:1e:67': 'Intel',
  '00:21:6a': 'Intel',
  '00:50:56': 'VMware',
  '3c:a8:2a': 'TP-Link',
  '50:c7:bf': 'TP-Link',
  '74:da:38': 'TP-Link',
  '90:9a:4a': 'TP-Link',
  'c0:25:e9': 'TP-Link',
  'f4:f2:6d': 'TP-Link',
  '00:17:88': 'Philips',
  '00:23:97': 'Google',
  '00:1a:11': 'Google',
  '3c:5a:b4': 'Google',
  '54:60:09': 'Google',
  '6c:ad:f8': 'Google',
  '98:5f:d3': 'Nest Labs',
  'a4:77:33': 'Google',
  'd0:c5:d3': 'Amazon',
  'f0:27:2d': 'Amazon',
  '00:fc:8b': 'Amazon',
  '34:d2:70': 'Amazon',
  '38:f7:3d': 'Amazon',
  '44:65:0d': 'Amazon',
  '50:dc:e7': 'Amazon',
  '74:75:48': 'Amazon',
  '84:d6:d0': 'Amazon',
  'ac:63:be': 'Amazon',
  'b0:7f:b9': 'Netgear',
  '00:09:5b': 'Netgear',
  'a0:63:91': 'Netgear',
  'c0:3f:0e': 'Netgear',
  'e0:46:9a': 'Netgear',
  '08:02:8e': 'Netgear',
  '74:44:01': 'Netgear',
  '00:10:18': 'Broadcom',
  'b4:75:0e': 'D-Link',
  '14:d6:4d': 'D-Link',
  '00:1b:11': 'D-Link',
  '00:26:5a': 'D-Link',
  '18:0f:76': 'Nest Labs',
  '64:16:66': 'Nest Labs',
  'a4:da:32': 'Nest Labs',
  '1c:ba:8c': 'Roku',
  'b8:3e:59': 'Roku',
  'd0:4f:7e': 'Roku',
  '00:0d:b9': 'Roku',
  '00:1d:ba': 'Nintendo',
  '18:2a:7b': 'Nintendo',
  '34:af:2c': 'Nintendo',
  '58:bd:a3': 'Nintendo',
  '78:a2:a0': 'Nintendo',
  '7c:bb:8a': 'Nintendo',
  'a4:5c:27': 'Nintendo',
  'a4:c0:e1': 'Nintendo',
  'b8:ae:ed': 'Nintendo',
  'cc:9e:00': 'Nintendo',
  'dc:68:eb': 'Nintendo',
  '00:04:20': 'Slim Devices (Sonos)',
  '00:0e:58': 'Sonos',
  '5c:aa:fd': 'Sonos',
  '78:28:ca': 'Sonos',
  'b8:e9:37': 'Sonos',
  '00:01:02': 'Xerox',
  '00:00:aa': 'Xerox',
};

// Get vendor from MAC address
function getVendor(mac) {
  try {
    if (!mac || mac === '(incomplete)') return null;

    // Normalize MAC address: expand shortened format and convert to lowercase
    // Handle formats like "90:9:d0" -> "90:09:d0"
    const parts = mac.toLowerCase().split(':');
    const normalized = parts.map(part => part.length === 1 ? '0' + part : part).join(':');
    const prefix = normalized.substring(0, 8); // First 3 bytes (xx:xx:xx)

    // Exact match
    if (macVendors[prefix]) {
      return macVendors[prefix];
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Store Bonjour-discovered devices
const bonjourDevices = new Map();

// Store SSDP-discovered devices (Bambu Labs printers)
const ssdpDevices = new Map();

// Start Bonjour browser
function startBonjourDiscovery() {
  // Browse for all services
  const browser = bonjour.find({});

  browser.on('up', (service) => {
    if (service.addresses && service.addresses.length > 0) {
      service.addresses.forEach(addr => {
        if (addr.includes('.')) { // IPv4 only
          bonjourDevices.set(addr, {
            name: service.name,
            type: service.type,
            host: service.host
          });
        }
      });
    }
  });

  browser.on('down', (service) => {
    if (service.addresses && service.addresses.length > 0) {
      service.addresses.forEach(addr => {
        bonjourDevices.delete(addr);
      });
    }
  });
}

// Start SSDP discovery for Bambu Labs printers
function startSSDPDiscovery() {
  const client = new Client();

  client.on('response', (headers, statusCode, rinfo) => {
    const ip = rinfo.address;

    // Log all SSDP responses for debugging
    console.log(`SSDP response from ${ip}:`, {
      ST: headers.ST,
      USN: headers.USN,
      SERVER: headers.SERVER
    });

    // Check if this is a Bambu Lab printer
    if (headers.ST && (headers.ST.includes('bambulab') || headers.ST.includes('3dprinter'))) {
      // Extract device info from headers
      const deviceInfo = {
        name: headers['USN'] || headers['SERVER'] || 'Bambu Lab Printer',
        location: headers['LOCATION'],
        server: headers['SERVER'],
        serviceType: headers['ST']
      };

      ssdpDevices.set(ip, deviceInfo);
      console.log(`✓ Found Bambu Lab printer at ${ip}:`, deviceInfo);
    }
  });

  // Search for Bambu Lab printers AND generic devices
  function doSearch() {
    console.log('Searching for SSDP devices...');
    client.search('urn:bambulab-com:device:3dprinter:1');
    setTimeout(() => client.search('ssdp:all'), 1000);
  }

  // Search every 30 seconds
  setInterval(doSearch, 30000);

  // Initial search
  doSearch();
}

// Initialize discovery services
startBonjourDiscovery();
startSSDPDiscovery();

// Parse ARP table
async function getARPTable() {
  try {
    const { stdout } = await execAsync('arp -a');
    const devices = [];
    const lines = stdout.split('\n');

    for (let line of lines) {
      // Match lines like: ? (192.168.1.1) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]
      const match = line.match(/\(([\d.]+)\)\s+at\s+([\w:]+)/);
      if (match) {
        const ip = match[1];
        const mac = match[2];

        // Skip invalid MAC addresses
        if (mac === 'ff:ff:ff:ff:ff:ff' || mac === '(incomplete)') {
          continue;
        }

        // Get vendor, Bonjour, and SSDP info
        const vendor = getVendor(mac);
        const bonjourInfo = bonjourDevices.get(ip);
        const ssdpInfo = ssdpDevices.get(ip);

        devices.push({
          ip,
          mac,
          hostname: null,
          vendor: vendor,
          bonjourName: bonjourInfo ? bonjourInfo.name : null,
          bonjourType: bonjourInfo ? bonjourInfo.type : null,
          bambuName: ssdpInfo ? ssdpInfo.name : null,
          status: 'unknown'
        });
      }
    }

    return devices;
  } catch (error) {
    console.error('Error reading ARP table:', error);
    return [];
  }
}

// Try to resolve hostname
async function resolveHostname(ip) {
  try {
    const { stdout } = await execAsync(`host ${ip}`, { timeout: 2000 });
    const match = stdout.match(/pointer\s+(.+)\./);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

// Scan network subnet
async function scanSubnet(baseIP) {
  const subnet = baseIP.substring(0, baseIP.lastIndexOf('.'));
  const devices = [];
  
  console.log(`Scanning subnet ${subnet}.0/24...`);
  
  // Ping sweep to populate ARP cache
  const pingPromises = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `${subnet}.${i}`;
    pingPromises.push(
      execAsync(`ping -c 1 -W 1 ${ip}`, { timeout: 2000 })
        .then(() => ({ ip, alive: true }))
        .catch(() => ({ ip, alive: false }))
    );
  }
  
  await Promise.all(pingPromises);
  
  // Now read ARP table
  const arpDevices = await getARPTable();

  // Try to get hostnames
  for (let device of arpDevices) {
    const hostname = await resolveHostname(device.ip);
    if (hostname) {
      device.hostname = hostname;
    }
    device.status = 'online';
  }

  return arpDevices;
}

// API endpoint to get network info
app.get('/api/network-info', async (req, res) => {
  const localIP = getLocalIP();
  res.json({ localIP });
});

// API endpoint to scan network
app.get('/api/scan', async (req, res) => {
  try {
    const localIP = getLocalIP();
    const devices = await scanSubnet(localIP);
    
    res.json({
      success: true,
      localIP,
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quick scan using just ARP table
app.get('/api/quick-scan', async (req, res) => {
  try {
    const localIP = getLocalIP();
    const devices = await getARPTable();
    
    res.json({
      success: true,
      localIP,
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Quick scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Network Scanner running on http://localhost:${PORT}`);
  console.log(`Local IP: ${getLocalIP()}`);
});
