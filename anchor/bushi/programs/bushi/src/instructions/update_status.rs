use anchor_lang::prelude::*;
use crate::state::DeviceState;
use mpl_core::{
    ID as MPL_CORE_ID,
    instructions::UpdatePluginV1CpiBuilder,
    types::{Plugin, FreezeDelegate},
};

#[derive(Accounts)]
pub struct UpdateDeviceStatus<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

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

pub fn handler(ctx: Context<UpdateDeviceStatus>, is_stolen: bool, recovery_contact: Option<String>) -> Result<()> {
    let device_state = &mut ctx.accounts.device_state;
    
    device_state.is_stolen = is_stolen;
    
    if is_stolen {
        device_state.recovery_contact = recovery_contact;
    } else {
        device_state.recovery_contact = None; // Clear it if reported found
    }

    // Freeze or unfreeze the asset based on the status
    let plugin = Plugin::FreezeDelegate(FreezeDelegate { frozen: is_stolen });

    // PDA seeds for signing the CPI
    let hashed_imei = device_state.hashed_imei;
    let bump = device_state.bump;
    let seeds = &[
        b"device".as_ref(),
        hashed_imei.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let mut device_state_info = ctx.accounts.device_state.to_account_info();
    device_state_info.is_signer = true;

    UpdatePluginV1CpiBuilder::new(&ctx.accounts.core_program)
        .asset(&ctx.accounts.asset)
        .authority(Some(&device_state_info))
        .payer(&ctx.accounts.owner)
        .system_program(&ctx.accounts.system_program)
        .plugin(plugin)
        .invoke_signed(signer_seeds)?;

    Ok(())
}
