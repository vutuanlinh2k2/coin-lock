#[test_only]
module coin_lock::coin_lock_tests {
    use sui::test_scenario::{Self};
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::clock::{Self};
    use sui::balance::{Self};
    use sui::dynamic_field;
    use std::string::{Self, String};
    use coin_lock::coin_lock::{Self, CoinLock};

    // Constant from coin_lock.move
    const NOTE_KEY: vector<u8> = b"note";
    const NOTE_VALUE: vector<u8> = b"Test Fund";
    const DURATION: u64 = 1000;
    const COIN_VALUE: u64 = 1000;

    /// Test 1: Successful creation with note
    #[test]
    fun test_lock_coin_with_note() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // STEP 1: Create a coin_lock with a note
        let coin = coin::mint_for_testing<SUI>(COIN_VALUE, ctx);
        let note = option::some(string::utf8(NOTE_VALUE));
        let clock = clock::create_for_testing(ctx);
        coin_lock::lock_coin(coin, DURATION, note, &clock, ctx);

        // STEP 2: Retrieve the created coin_lock
        test_scenario::next_tx(&mut scenario, @0xA);
        let coin_lock = test_scenario::take_from_sender<CoinLock>(&scenario);

        // STEP 3: Assert coin_lock properties
        assert!(coin_lock::duration(&coin_lock) == DURATION, 0);
        assert!(coin_lock::time_created(&coin_lock) == 0, 1);
        assert!(balance::value(coin_lock::balance(&coin_lock)) == COIN_VALUE, 2);
        let retrieved_note = dynamic_field::borrow<vector<u8>, String>(coin_lock::id(&coin_lock), NOTE_KEY);
        assert!(*retrieved_note == string::utf8(NOTE_VALUE), 3);

        // STEP 4: Clean up
        test_scenario::return_to_sender(&scenario, coin_lock);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    /// Test 2: Successful creation without note
    #[test]
    fun test_lock_coin_without_note() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // STEP 1: Create a coin_lock without a note
        let coin = coin::mint_for_testing<SUI>(COIN_VALUE, ctx);
        let note = option::none<String>();
        let clock = clock::create_for_testing(ctx);
        coin_lock::lock_coin(coin, DURATION, note, &clock, ctx);

        // STEP 2: Retrieve the created coin_lock
        test_scenario::next_tx(&mut scenario, @0xA);
        let coin_lock = test_scenario::take_from_sender<CoinLock>(&scenario);
        
        // STEP 3: Assert coin_lock properties
        assert!(coin_lock::duration(&coin_lock) == DURATION, 0);
        assert!(balance::value(coin_lock::balance(&coin_lock)) == COIN_VALUE, 1);
        assert!(!dynamic_field::exists_(coin_lock::id(&coin_lock), NOTE_KEY), 2);

        // STEP 4: Clean up
        test_scenario::return_to_sender(&scenario, coin_lock);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    /// Test 3: Withdrawal after duration
    #[test]
    fun test_withdraw_coin_after_duration() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // STEP 1: Create a coin_lock
        let coin = coin::mint_for_testing<SUI>(COIN_VALUE, ctx);
        let note = option::some(string::utf8(NOTE_VALUE));
        let mut clock = clock::create_for_testing(ctx);
        coin_lock::lock_coin(coin, DURATION, note, &clock, ctx);

        // STEP 2: Set the clock to pass the duration
        test_scenario::next_tx(&mut scenario, @0xA);
        let clock_timestamp_ms = clock::timestamp_ms(&clock);
        clock::set_for_testing(&mut clock, clock_timestamp_ms + DURATION + 1);

        // STEP 3: Withdraw from the coin_lock
        let coin_lock = test_scenario::take_from_sender<CoinLock>(&scenario);
        let ctx = test_scenario::ctx(&mut scenario);
        coin_lock::withdraw_coin(coin_lock, &clock, ctx);

        // STEP 4: Assert the withdrawal
        test_scenario::next_tx(&mut scenario, @0xA);
        let withdrawn_coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&withdrawn_coin) == COIN_VALUE, 0);
        test_scenario::return_to_sender(&scenario, withdrawn_coin);

        // STEP 5: Clean up
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    /// Test 4: Withdrawal exactly at duration
    #[test]
    fun test_withdraw_coin_exactly_at_duration() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // STEP 1: Create a coin_lock
        let coin = coin::mint_for_testing<SUI>(COIN_VALUE, ctx);
        let note = option::some(string::utf8(NOTE_VALUE));
        let mut clock = clock::create_for_testing(ctx);
        coin_lock::lock_coin(coin, DURATION, note, &clock, ctx);

        // STEP 2: Set the clock to pass the duration
        test_scenario::next_tx(&mut scenario, @0xA);
        let clock_timestamp_ms = clock::timestamp_ms(&clock);
        clock::set_for_testing(&mut clock, clock_timestamp_ms + DURATION);

        // STEP 3: Withdraw from the coin_lock
        let coin_lock = test_scenario::take_from_sender<CoinLock>(&scenario);
        let ctx = test_scenario::ctx(&mut scenario);
        coin_lock::withdraw_coin(coin_lock, &clock, ctx);

        // STEP 4: Assert the withdrawal
        test_scenario::next_tx(&mut scenario, @0xA);
        let withdrawn_coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&withdrawn_coin) == COIN_VALUE, 0);
        test_scenario::return_to_sender(&scenario, withdrawn_coin);

        // STEP 5: Clean up
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    /// Test 5: Withdrawal before duration
    #[test]
    #[expected_failure(abort_code = coin_lock::E_WITHDRAW_BEFORE_DURATION)]
    fun test_withdraw_coin_before_duration() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // STEP 1: Create a coin
        let coin = coin::mint_for_testing<SUI>(COIN_VALUE, ctx);
        let note = option::some(string::utf8(NOTE_VALUE));
        let mut clock = clock::create_for_testing(ctx);
        coin_lock::lock_coin(coin, DURATION, note, &clock, ctx);

        // STEP 2: Set the clock to pass the duration
        test_scenario::next_tx(&mut scenario, @0xA);
        let clock_timestamp_ms = clock::timestamp_ms(&clock);
        clock::set_for_testing(&mut clock, clock_timestamp_ms + DURATION - 1);

        // STEP 3: Withdraw from the coin_lock
        let coin_lock = test_scenario::take_from_sender<CoinLock>(&scenario);
        let ctx = test_scenario::ctx(&mut scenario);
        coin_lock::withdraw_coin(coin_lock, &clock, ctx);

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    /// Test 6: Invalid duration (zero)
    #[test]
    #[expected_failure(abort_code = coin_lock::E_DURATION_INPUT_NOT_POSITIVE)]
    fun test_lock_coin_invalid_duration_input() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let coin = coin::mint_for_testing<SUI>(COIN_VALUE, ctx);
        let note = option::some(string::utf8(NOTE_VALUE));
        let clock = clock::create_for_testing(ctx);

        coin_lock::lock_coin(coin, 0, note, &clock, ctx);

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}