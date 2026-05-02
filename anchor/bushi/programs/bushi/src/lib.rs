pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("7q5NBAiPcSNJ7RG3b4xyVZrzj9ohdxQxFiBivmEZhGiG"); // Placeholder ID

#[program]
pub mod bushi {
    use super::*;

    pub fn mint_device_nft(ctx: Context<MintDeviceNft>, hashed_imei: [u8; 32]) -> Result<()> {
        instructions::mint_device::handler(ctx, hashed_imei)
    }

    pub fn transfer_device_nft(ctx: Context<TransferDeviceNft>) -> Result<()> {
        instructions::transfer_device::handler(ctx)
    }

    pub fn update_device_status(ctx: Context<UpdateDeviceStatus>, is_stolen: bool, recovery_contact: Option<String>) -> Result<()> {
        instructions::update_status::handler(ctx, is_stolen, recovery_contact)
    }
}
