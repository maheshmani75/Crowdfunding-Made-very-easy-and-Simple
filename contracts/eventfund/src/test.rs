#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, Address};
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient;

#[test]
fn test_pledge() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EventFund);
    let client = EventFundClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    
    // Create token
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin.clone());
    let token = TokenClient::new(&env, &token_contract);
    let token_admin_client = StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);

    let target = 500;
    let deadline = env.ledger().timestamp() + 1000;

    client.init(&admin, &target, &deadline);

    assert_eq!(client.get_target(), 500);
    assert_eq!(client.get_pledged(), 0);

    client.pledge(&user1, &token_contract, &100);

    assert_eq!(client.get_pledged(), 100);
    assert_eq!(token.balance(&user1), 900);
    assert_eq!(token.balance(&contract_id), 100);
}
