/* --- BAZA TEKSTÓW I OSOBOWOŚCI LEDGERCOON V2 --- */

const LEDGER_STRINGS = {
    pl: {
        // Hierarchia Shadow Ranks
        ranks: [
            "Dust Collector", 
            "Alley Runner", 
            "Vault Whisperer", 
            "Liquidity Ghost", 
            "Sovereign Coon"
        ],
        
        // Cytaty na Splash Screen (Wizjonerzy i Stashek)
        quotes: [
            "Cena jest tym, co płacisz. Wartość jest tym, co otrzymujesz. — Warren Buffett",
            "Nawyk oszczędzania jest sam w sobie edukacją. — Stewart Johnson",
            "Zbyt wielu ludzi wydaje pieniądze, których nie zarobili... — Will Rogers",
            "Pieniądze szczęścia nie dają, ale lepiej płakać w Ferrari. — Stashek",
            "Kto kupuje rzeczy, których nie potrzebuje, okrada samego siebie. — Benjamin Franklin"
        ],
        
        // Dialogi Stashka (Dynamiczne)
        stashek: {
            welcome: "Księgi otwarte. Co tam psujemy dzisiaj, Szefie?",
            good: "Konto lśni jak umyte winogrono. Nie zepsuj tego.",
            neutral: "Jeszcze nie jesz tektury. Jest stabilnie.",
            bad: "Alarm! Płynność wyparowała. Czas na dietę z krakersów.",
            panic: "ODŁÓŻ TO! Nie stać nas na takie luksusy!",
            night: "Szefie, 3 rano... Liczysz siano czy owce? Idź spać.",
            vision: "Chcesz na to tylko patrzeć, czy naprawdę to mieć?",
            shred: "Jeden wróg mniej. Dokumentacja długu zniszczona.",
            decoy: "Tryb Przynęty aktywny. Oficjalnie jesteśmy spłukani.",
            pills: "Pijawki znowu ssą Twoje konto. Widzisz te subskrypcje?"
        },
        
        // Interfejs V2
        ui: {
            today: "DOSTĘPNE DZIŚ",
            stash: "SKARBIEC",
            vision: "WIZJA",
            notes: "NOTATKI",
            survival: "Paliwa na",
            days: "dni",
            ghost_now: "TERAZ",
            ghost_future: "PROGNOZA",
            confirm: "Zatwierdź",
            cancel: "Wróć",
            shredder: "NISZCZARKA DŁUGÓW"
        }
    },
    
    en: {
        // Shadow Ranks Hierarchy
        ranks: [
            "Dust Collector", 
            "Alley Runner", 
            "Vault Whisperer", 
            "Liquidity Ghost", 
            "Sovereign Coon"
        ],
        
        // Splash Screen Quotes
        quotes: [
            "Price is what you pay. Value is what you get. — Warren Buffett",
            "The habit of saving is itself an education. — Stewart Johnson",
            "Too many people spend money they haven't earned... — Will Rogers",
            "Money doesn't buy happiness, but I'd rather cry in a Ferrari. — Stash",
            "He who buys what he does not need, steals from himself. — Benjamin Franklin"
        ],
        
        // Stash's Dialogues
        stashek: {
            welcome: "Books open. What are we breaking today, Boss?",
            good: "Wallet's fat like a fresh grape. Don't ruin it.",
            neutral: "Not eating cardboard yet. It's stable.",
            bad: "Alert! Liquidity evaporated. Time for a cracker diet.",
            panic: "PUT IT BACK! We can't afford such luxuries!",
            night: "Boss, 3 AM... Counting cash or sheep? Go to sleep.",
            vision: "Do you want to just look at it, or actually own it?",
            shred: "One enemy less. Debt documentation shredded.",
            decoy: "Decoy mode active. Officially, we are broke.",
            pills: "Leeches are sucking your account dry. Look at these subs!"
        },
        
        // UI V2
        ui: {
            today: "AVAILABLE TODAY",
            stash: "STASH",
            vision: "VISION",
            notes: "NOTES",
            survival: "Fuel for",
            days: "days",
            ghost_now: "NOW",
            ghost_future: "FORECAST",
            confirm: "Confirm",
            cancel: "Back",
            shredder: "DEBT SHREDDER"
        }
    }
};

/* Funkcja pomocnicza do pobierania tekstów */
function getString(path) {
    const lang = state.lang || 'pl';
    const keys = path.split('.');
    let result = LEDGER_STRINGS[lang];
    
    for (const key of keys) {
        if (result && result[key]) {
            result = result[key];
        } else {
            return path;
        }
    }
    return result;
}
