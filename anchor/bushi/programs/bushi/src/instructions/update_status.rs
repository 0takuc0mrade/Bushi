use anchor_lang::{prelude::*, system_program};
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

    /// CHECK: This is safe because we just send lamports here
    #[account(mut)]
    pub finder: Option<UncheckedAccount<'info>>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateDeviceStatus>, is_stolen: bool, recovery_contact: Option<String>, bounty_lamports: u64) -> Result<()> {
    let device_state = &mut ctx.accounts.device_state;
    
    device_state.is_stolen = is_stolen;
    
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

    let device_state_info = device_state.to_account_info();

    UpdatePluginV1CpiBuilder::new(&ctx.accounts.core_program)
        .asset(&ctx.accounts.asset)
        .authority(Some(&device_state_info))
        .payer(&ctx.accounts.owner)
        .system_program(&ctx.accounts.system_program)
        .plugin(plugin)
        .invoke_signed(signer_seeds)?;

    // Handle bounty transfers AFTER CPI
    if is_stolen {
        device_state.recovery_contact = recovery_contact;
        
        // Lock the bounty if > 0
        if bounty_lamports > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.key(),
                    system_program::Transfer {
                        from: ctx.accounts.owner.to_account_info(),
                        to: device_state.to_account_info(),
                    },
                ),
                bounty_lamports,
            )?;
            device_state.bounty_lamports += bounty_lamports;
        }
    } else {
        device_state.recovery_contact = None; // Clear it if reported found
        
        // Release the bounty if there is one
        let payout = device_state.bounty_lamports;
        if payout > 0 {
            let receiver_info = if let Some(finder) = &ctx.accounts.finder {
                finder.to_account_info()
            } else {
                ctx.accounts.owner.to_account_info()
            };

            let device_state_info_again = device_state.to_account_info();
            
            **device_state_info_again.try_borrow_mut_lamports()? -= payout;
            **receiver_info.try_borrow_mut_lamports()? += payout;
            
            device_state.bounty_lamports = 0;
        }
    }

    Ok(())
}
