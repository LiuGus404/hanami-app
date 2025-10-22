import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 創建默認扭蛋機
    const { data: machine, error: machineError } = await supabase
      .from('saas_gacha_machines')
      .insert({
        machine_name: 'Hanami VIP 扭蛋機',
        machine_slug: 'hanami-vip-gachapon',
        description: '花見音樂專屬 VIP 扭蛋機，精美獎品等你來拿！',
        image_url: '/HanamiMusic/nunu/nunubasic.png',
        background_url: '/HanamiMusic/nunu/nunucalssroom.png',
        theme_config: {
          primary_color: '#FFD59A',
          secondary_color: '#EBC9A4',
          accent_color: '#FFB6C1'
        },
        single_draw_cost: 10,
        ten_draw_cost: 90,
        ten_draw_bonus: 1,
        is_active: true,
        is_default: true,
        display_order: 1
      })
      .select()
      .single();

    if (machineError) {
      console.error('創建扭蛋機失敗:', machineError);
      return NextResponse.json({ error: '創建扭蛋機失敗' }, { status: 500 });
    }

    // 創建獎勵
    const rewards = [
      {
        reward_name: '免費試堂券',
        reward_description: '可免費參加一次音樂試堂課程',
        reward_type: 'free_trial',
        rarity: 'common',
        icon_emoji: '🎵',
        reward_value: { type: 'free_trial', value: 1 },
        usage_limit: 1,
        valid_days: 30,
        delivery_type: 'auto',
        is_active: true
      },
      {
        reward_name: '課程折扣券 9折',
        reward_description: '正式課程可享9折優惠',
        reward_type: 'discount_coupon',
        rarity: 'common',
        icon_emoji: '🎫',
        reward_value: { type: 'discount', percentage: 10 },
        usage_limit: 1,
        valid_days: 60,
        delivery_type: 'auto',
        is_active: true
      },
      {
        reward_name: '課程折扣券 8折',
        reward_description: '正式課程可享8折優惠',
        reward_type: 'discount_coupon',
        rarity: 'rare',
        icon_emoji: '🎫',
        reward_value: { type: 'discount', percentage: 20 },
        usage_limit: 1,
        valid_days: 60,
        delivery_type: 'auto',
        is_active: true
      },
      {
        reward_name: '專屬音樂禮品包',
        reward_description: '包含音樂小禮物的精美禮品包',
        reward_type: 'physical_gift',
        rarity: 'rare',
        icon_emoji: '🎁',
        reward_value: { type: 'physical_gift', description: '音樂禮品包' },
        usage_limit: 1,
        valid_days: 90,
        delivery_type: 'physical',
        is_active: true
      },
      {
        reward_name: 'VIP 一對一指導',
        reward_description: '獲得一次VIP專屬一對一音樂指導',
        reward_type: 'vip_upgrade',
        rarity: 'epic',
        icon_emoji: '👑',
        reward_value: { type: 'vip_session', duration: 60 },
        usage_limit: 1,
        valid_days: 120,
        delivery_type: 'manual',
        is_active: true
      },
      {
        reward_name: '終身課程會員',
        reward_description: '獲得終身免費參加所有課程的特權',
        reward_type: 'subscription_extend',
        rarity: 'legendary',
        icon_emoji: '🌟',
        reward_value: { type: 'lifetime_membership', value: 'lifetime' },
        usage_limit: 1,
        valid_days: null,
        delivery_type: 'manual',
        is_active: true
      }
    ];

    const { data: createdRewards, error: rewardsError } = await supabase
      .from('saas_gacha_rewards')
      .insert(rewards)
      .select();

    if (rewardsError) {
      console.error('創建獎勵失敗:', rewardsError);
      return NextResponse.json({ error: '創建獎勵失敗' }, { status: 500 });
    }

    // 創建扭蛋機獎勵關聯
    const machineRewards = [
      { machine_id: machine.id, reward_id: createdRewards[0].id, probability: 40, weight: 100, display_order: 1 },
      { machine_id: machine.id, reward_id: createdRewards[1].id, probability: 25, weight: 100, display_order: 2 },
      { machine_id: machine.id, reward_id: createdRewards[2].id, probability: 15, weight: 100, display_order: 3 },
      { machine_id: machine.id, reward_id: createdRewards[3].id, probability: 10, weight: 100, display_order: 4 },
      { machine_id: machine.id, reward_id: createdRewards[4].id, probability: 7, weight: 100, display_order: 5 },
      { machine_id: machine.id, reward_id: createdRewards[5].id, probability: 3, weight: 100, display_order: 6 }
    ];

    const { error: machineRewardsError } = await supabase
      .from('saas_gacha_machine_rewards')
      .insert(machineRewards);

    if (machineRewardsError) {
      console.error('創建扭蛋機獎勵關聯失敗:', machineRewardsError);
      return NextResponse.json({ error: '創建扭蛋機獎勵關聯失敗' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '扭蛋機系統初始化成功',
      machine,
      rewards: createdRewards
    });

  } catch (error) {
    console.error('初始化扭蛋機系統失敗:', error);
    return NextResponse.json({ 
      error: '初始化扭蛋機系統失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

