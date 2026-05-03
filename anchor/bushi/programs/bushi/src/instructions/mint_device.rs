use anchor_lang::prelude::*;
use crate::state::DeviceState;
use mpl_core::{
    ID as MPL_CORE_ID,
    instructions::CreateV1CpiBuilder,
    types::{Plugin, PluginAuthorityPair, FreezeDelegate},
};

#[derive(Accounts)]
#[instruction(hashed_imei: [u8; 32])]
pub struct MintDeviceNft<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = DeviceState::INIT_SPACE,
        seeds = [b"device", hashed_imei.as_ref()],
        bump
    )]
    pub device_state: Account<'info, DeviceState>,

    /// CHECK: The Metaplex Core Asset account to be created
    #[account(mut)]
    pub asset: Signer<'info>,

    #[account(address = MPL_CORE_ID)]
    /// CHECK: Metaplex Core program
    pub core_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MintDeviceNft>, hashed_imei: [u8; 32]) -> Result<()> {
    let device_state = &mut ctx.accounts.device_state;
    
    device_state.owner = ctx.accounts.signer.key();
    device_state.asset_id = ctx.accounts.asset.key();
    device_state.hashed_imei = hashed_imei;
    device_state.is_stolen = false;
    device_state.recovery_contact = None;
    device_state.bounty_lamports = 0;
    device_state.bump = ctx.bumps.device_state;

    // Attach the Freeze Delegate Plugin so the DeviceState PDA has absolute control
    let freeze_delegate = PluginAuthorityPair {
        plugin: Plugin::FreezeDelegate(FreezeDelegate {
            frozen: false,
        }),
        authority: Some(mpl_core::types::PluginAuthority::Address { address: device_state.key() }),
    };

    CreateV1CpiBuilder::new(&ctx.accounts.core_program)
        .asset(&ctx.accounts.asset)
        .payer(&ctx.accounts.signer)
        .authority(Some(&ctx.accounts.signer))
        .owner(Some(&ctx.accounts.signer))
        .system_program(&ctx.accounts.system_program)
        .name("Bushi Device".to_string())
        .uri("https://bushi.app/metadata.json".to_string())
        .plugins(vec![freeze_delegate])
        .invoke()?;

    Ok(())
}
