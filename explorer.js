const blessed = require('blessed');
const solana = require('@solana/web3.js');
const conn = new solana.Connection(
    solana.clusterApiUrl("mainnet-beta")
)

function displayTimestamp(unixTimestamp) {
  const expireDate = new Date(unixTimestamp);
  const dateString = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(expireDate);
  const timeString = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    timeZoneName: "long",
  }).format(expireDate);
  return `${dateString} at ${timeString}`;
}

const screen = blessed.screen({
    smartCSR: true,
    title: 'Blessed form'
});

const form = blessed.form({
    parent: screen,
    width: '90%',
    left: 'center',
    keys: true,
    vi: true
});

const searchLabel = blessed.text({
    parent: screen,
    top: 3,
    left: 19,
    content: 'Search for blocks, accounts, transactions, programs, and tokens:'
});

const searchBox = blessed.textbox({
    parent: form,
    name: 'searchbox',
    top: 4,
    left: 5,
    height: 3,
    inputOnFocus: true,
    content: '',
    border: {
        type: 'line'
    },
    focus: {
        fg: 'blue'
    }
});

const searchBtn = blessed.button({
    parent: form,
    name: 'search',
    content: 'Search',
    top: 8,
    left: 6,
    shrink: true,
    padding: {
        top: 1,
        right: 2,
        bottom: 1,
        left: 2
    },
    style: {
        bold: true,
        fg: 'white',
        bg: 'green',
        focus: {
            inverse: true
        }
    }
});

const detail = blessed.text({
    parent: screen,
    top: 12,
    left: 18,
    tags: true,
    content: "",
});

searchBtn.on('press', function () {
    form.submit();
});

form.on('submit', async function (data) {
    let tx = await conn.getParsedConfirmedTransaction(data.searchbox);

    let statusText = "Success";
    if (tx.meta.err) {
        statusText = "Error";
    }

    let fee = tx.meta.fee / 1e9;
    let recentBlockhash = tx.transaction.message.recentBlockhash;

    let status = await conn.getSignatureStatus(data.searchbox, { searchTransactionHistory: true });
    let value = status.value;

    let slot = null;
    let timestamp = null;
    let blockTime = null;
    let confirmations = null;
    if (value !== null) {
        slot = value.slot;
        try {
            blockTime = await conn.getBlockTime(value.slot);
        } catch (error) {
            console.log(error);
        }
        timestamp = blockTime !== null ? displayTimestamp(blockTime * 1000) : "unavailable";

        if (typeof value.confirmations === "number") {
            confirmations = value.confirmations;
        } else {
            confirmations = "max";
        }
    }

    let summary = '';
    summary += `Signature: ${data.searchbox}\n`;
    summary += `Result: ${statusText}\n`;
    summary += `Timestamp: ${timestamp}\n`;
    summary += `Confirmations: ${confirmations}\n`;
    summary += `Block: ${slot}\n`;
    summary += `Recent Blockhash: ${recentBlockhash}\n`;
    summary += `Fee(SOL): ${fee}\n`;

    detail.setContent(summary);
});

// Key bindings
screen.key('q', function () {
    this.destroy();
});

// Render everything!
screen.render();
