use anchor_lang::prelude::*;
use crate::state::DeviceState;
use mpl_core::{
    ID as MPL_CORE_ID,
    instructions::TransferV1CpiBuilder,
};

#[derive(Accounts)]
pub struct TransferDeviceNft<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: The new owner of the device
    pub new_owner: UncheckedAccount<'info>,

    #[account(
        mut,
        has_one = owner,
    )]
    pub device_state: Account<'info, DeviceState>,

    /// CHECK: The Metaplex Core Asset account
    #[account(mut, address = device_state.asset_id)]
    pub asset: UncheckedAccount<'info>,

    #[account(address = MPL_CORE_ID)]
    /// CHECK: Metaplex Core program
    pub core_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<TransferDeviceNft>) -> Result<()> {
    let device_state = &mut ctx.accounts.device_state;
    
    // Ensure the device is not stolen before allowing transfer
    require!(!device_state.is_stolen, crate::error::ErrorCode::CustomError); 
    
    device_state.owner = ctx.accounts.new_owner.key();

    TransferV1CpiBuilder::new(&ctx.accounts.core_program)
        .asset(&ctx.accounts.asset)
        .authority(Some(&ctx.accounts.owner))
        .new_owner(&ctx.accounts.new_owner)
        .payer(&ctx.accounts.owner)
        .system_program(Some(&ctx.accounts.system_program))
        .invoke()?;

    Ok(())
}
