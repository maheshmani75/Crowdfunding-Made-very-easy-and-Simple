#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, token,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Target,
    Pledged,
    Deadline,
    UserPledge(Address),
}

#[contract]
pub struct EventFund;

#[contractimpl]
impl EventFund {
    /// Initialize the campaign
    pub fn init(env: Env, admin: Address, target: i128, deadline: u64) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Target, &target);
        env.storage().instance().set(&DataKey::Deadline, &deadline);
        env.storage().instance().set(&DataKey::Pledged, &0i128);
    }

    /// Pledge to the campaign using a specific token
    pub fn pledge(env: Env, caller: Address, token: Address, amount: i128) {
        caller.require_auth();

        let deadline: u64 = env.storage().instance().get(&DataKey::Deadline).unwrap();
        if env.ledger().timestamp() > deadline {
            panic!("Deadline passed");
        }

        // Transfer tokens from caller to the contract
        let client = token::Client::new(&env, &token);
        client.transfer(&caller, &env.current_contract_address(), &amount);

        // Update total pledged
        let mut pledged: i128 = env.storage().instance().get(&DataKey::Pledged).unwrap_or(0);
        pledged += amount;
        env.storage().instance().set(&DataKey::Pledged, &pledged);

        // Update user pledge
        let mut user_pledged: i128 = env.storage().instance().get(&DataKey::UserPledge(caller.clone())).unwrap_or(0);
        user_pledged += amount;
        env.storage().instance().set(&DataKey::UserPledge(caller.clone()), &user_pledged);

        // Emit an event
        let topics = (symbol_short!("pledged"), caller.clone());
        env.events().publish(topics, amount);
    }

    /// Get total pledged
    pub fn get_pledged(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Pledged).unwrap_or(0)
    }

    /// Get target
    pub fn get_target(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Target).unwrap_or(0)
    }
}

mod test;
