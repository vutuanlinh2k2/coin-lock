module coin_lock::coin_lock {

    use sui::clock::{Self, Clock};
    use std::string::String;
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::balance::{Balance};
    use sui::dynamic_field;
    
    // === Errors ===
    const E_WITHDRAW_BEFORE_DURATION: u64 = 0;
    const E_DURATION_INPUT_NOT_POSITIVE: u64 = 1;

    // === Constants ===
    const NOTE_KEY: vector<u8> = b"note";

    // === Structs ===
    public struct CoinLock has key {
        id: UID,
        balance: Balance<SUI>,
        time_created: u64, // timestamp in milliseconds
        duration: u64, // in milliseconds
    }

    // === Entry Functions ===
    public entry fun lock_coin(
        coin: Coin<SUI>,
        duration: u64,
        note: Option<String>,
        clock: &Clock, 
        ctx: &mut TxContext
    ) {
        assert!(duration > 0, E_DURATION_INPUT_NOT_POSITIVE);

        let balance = coin::into_balance(coin);

        let mut id = object::new(ctx);
        
        // Add the note as a dynamic field if provided
        if (option::is_some(&note)) {
            let note_value = option::destroy_some(note);
            dynamic_field::add(&mut id, NOTE_KEY, note_value);
        } else {
            option::destroy_none(note);
        };

        let coin_lock = CoinLock {
            id,
            balance,
            time_created: clock::timestamp_ms(clock),
            duration,
        };

        transfer::transfer(coin_lock, tx_context::sender(ctx));
    }

    #[allow(lint(self_transfer))] // prevent 'Transfer of an object to transaction sender address' warning
    public fun withdraw_coin(coin_lock: CoinLock, clock: &Clock, ctx: &mut TxContext) {
        let CoinLock { id, balance, time_created, duration } = coin_lock;
        
        let current_time = clock::timestamp_ms(clock);
        assert!(
            current_time >= time_created && 
            current_time - time_created >= duration, 
            E_WITHDRAW_BEFORE_DURATION
        );
        
        let coin_object = coin::from_balance(balance, ctx);

        transfer::public_transfer(coin_object, tx_context::sender(ctx));
        
        object::delete(id);
    }

    /// === Getter Functions ===
    public(package) fun id(coin_lock: &CoinLock): &UID {
        &coin_lock.id
    }

    public(package) fun duration(coin_lock: &CoinLock): u64 {
        coin_lock.duration
    }

    public(package) fun time_created(coin_lock: &CoinLock): u64 {
        coin_lock.time_created
    }

    public(package) fun balance(coin_lock: &CoinLock): &Balance<SUI> {
        &coin_lock.balance
    }

    public(package) fun get_note(coin_lock: &CoinLock): Option<String> {
        if (dynamic_field::exists_(&coin_lock.id, NOTE_KEY)) {
            option::some(*dynamic_field::borrow(&coin_lock.id, NOTE_KEY))
        } else {
            option::none<String>()
        }
    }
}