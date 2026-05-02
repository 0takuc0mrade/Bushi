use anchor_lang::prelude::*;

#[account]
pub struct DeviceState {
    pub owner: Pubkey,
    pub asset_id: Pubkey,
    pub hashed_imei: [u8; 32],
    pub is_stolen: bool,
    pub recovery_contact: Option<String>,
    pub bump: u8,
}

impl DeviceState {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 32 + 1 + (1 + 4 + 100) + 1;
}
