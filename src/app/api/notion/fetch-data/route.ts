import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, databaseId, startCursor, getPageContent } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Notion token is required' },
        { status: 400 },
      );
    }
    console.log('token', token);

    // 如果沒有提供 databaseId，先獲取用戶的資料庫列表
    if (!databaseId) {
      const searchResponse = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'database',
          },
        }),
      });

      if (!searchResponse.ok) {
        throw new Error(`Notion search API error: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      
      // 返回資料庫列表供用戶選擇
      return NextResponse.json({
        databases: searchData.results,
        message: 'Please select a database ID from the list above',
      });
    }

    // 如果有 databaseId，查詢該資料庫的內容
    const queryBody: any = {
      page_size: 100, // 限制每頁結果數量
    };

    // 如果有 startCursor，加入分頁參數
    if (startCursor) {
      queryBody.start_cursor = startCursor;
    }

    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
    });

    if (!queryResponse.ok) {
      throw new Error(`Notion database query error: ${queryResponse.statusText}`);
    }

    const data = await queryResponse.json();
    
    // 如果需要獲取頁面內容，則為每個頁面獲取內容區塊
    let results = data.results;
    if (getPageContent && results.length > 0) {
      const pagesWithContent = await Promise.all(
        results.map(async (page: any) => {
          try {
            // 獲取頁面的內容區塊
            const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28',
              },
            });

            if (blocksResponse.ok) {
              const blocksData = await blocksResponse.json();
              return {
                ...page,
                content_blocks: blocksData.results || [],
              };
            } else {
              console.warn(`Failed to fetch content for page ${page.id}:`, blocksResponse.statusText);
              return {
                ...page,
                content_blocks: [],
              };
            }
          } catch (error) {
            console.warn(`Error fetching content for page ${page.id}:`, error);
            return {
              ...page,
              content_blocks: [],
            };
          }
        }),
      );
      results = pagesWithContent;
    }
    
    return NextResponse.json({
      results,
      has_more: data.has_more,
      next_cursor: data.next_cursor,
    });

  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Notion' },
      { status: 500 },
    );
  }
}

// 獲取資料庫結構的 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const databaseId = searchParams.get('databaseId');

    if (!token) {
      return NextResponse.json(
        { error: 'Notion token is required' },
        { status: 400 },
      );
    }

    if (!databaseId) {
      return NextResponse.json(
        { error: 'Database ID is required' },
        { status: 400 },
      );
    }

    // 獲取資料庫結構
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      throw new Error(`Notion database API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      database: data,
      properties: data.properties,
    });

  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database structure from Notion' },
      { status: 500 },
    );
  }
} 