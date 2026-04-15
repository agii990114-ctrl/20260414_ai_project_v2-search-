import { useEffect, useState } from "react";
import axios from 'axios';
import './App.css'; // 작성한 CSS 임포트

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [boards, setBoards] = useState([]);
  const [loadState, setLoadState] = useState(false);
  const [boardState, setBoardState] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const itemsPerPage = 5;

  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  // const base_url = "aiedu.tplinkdns.com:6010/api";
  const base_url = "localhost:8000";

  const convertPythonStrToJs = (str) => {
    try {
      // 1. 파이썬의 datetime.datetime(Y, M, D, h, m, s)을 "YYYY-MM-DD HH:mm:ss" 형태의 문자열로 변환
      let fixedStr = str.replace(/datetime\.datetime\(([^)]+)\)/g, (match, p1) => {
        const parts = p1.split(',').map(p => p.trim());
        // [연, 월, 일, 시, 분, 초]를 2자리 숫자로 맞춰서 문자열 생성
        const yyyy = parts[0];
        const mm = parts[1].padStart(2, '0');
        const dd = parts[2].padStart(2, '0');
        const hh = parts[3] ? parts[3].padStart(2, '0') : '00';
        const min = parts[4] ? parts[4].padStart(2, '0') : '00';
        const ss = parts[5] ? parts[5].padStart(2, '0') : '00';

        return `"${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}"`;
      });

      // 2. 작은따옴표(')를 큰따옴표(")로 변경하여 JSON 표준 준수
      fixedStr = fixedStr.replace(/'/g, '"');

      // 3. 이제 표준 JSON 형식이 되었으므로 파싱 가능
      const result = JSON.parse(fixedStr);

      if (result["search_list"]) {
        setBoards(result["search_list"]);
        setCurrentPage(1)
      }


    } catch (e) {
      // console.error("파싱 실패:", e.message);
      return null;
    }
  };


  const send = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoadState(true);
    axios.post(`http://${base_url}/prompt`, { prompt })
      .then(response => {
        setLoadState(false);
        setPrompt('');
        alert(response.data.data.at(-1).content);
        convertPythonStrToJs(response.data.data.at(-2).content);
      })
      .catch(() => {
        setLoadState(false);
        alert("전송 중 오류가 발생했습니다.");
      });
  };

  useEffect(() => {
    axios.get(`http://${base_url}/get_list`)
      .then(response => { setBoards(response.data.data); })
      .catch(error => { console.error('Error:', error); });
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = boards ? boards.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.ceil((boards ? boards.length : 0) / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="app-container">
      <div className="main-row">

        {/* 메인 입력 섹션 */}
        <section className={`input-section ${boardState ? 'split-view' : 'full-view'}`}>
          <div className="main-card">
            <div className="toggle-header">
              <button
                type="button"
                className="btn btn-outline-primary list-toggle-btn shadow-sm"
                onClick={() => setBoardState(!boardState)}
              >
                {boardState ? "닫기" : "📋 목록 보기"}
              </button>
            </div>

            <div className="text-center mb-4">
              <h2 className="card-title">무엇을 도와드릴까요?</h2>
              <p className="text-muted">AI에게 글의 작성, 수정, 삭제, 검색을 요청해보세요.</p>
            </div>

            <form onSubmit={send} className="custom-input-group">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loadState}
              />
              <button className="btn btn-primary" type="submit" disabled={loadState}>
                {loadState ? <span className="spinner-border spinner-border-sm"></span> : "전송"}
              </button>
            </form>
          </div>
        </section>

        {/* 게시판 리스트 섹션 */}
        {boardState && (
          <aside className="board-section">
            <div className="board-header">
              <div>
                <h3 className="fw-bold m-0 text-primary">📋 데이터 목록</h3>
                <small className="text-muted">총 {boards.length}개의 기록이 있습니다.</small>
              </div>
              <button className="btn btn-sm btn-light d-xl-none" onClick={() => setBoardState(false)}>접기</button>
            </div>

            <div className="custom-table-container">
              <table className="custom-table table-hover align-middle">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: "80px" }}>No</th>
                    <th style={{ width: "150px" }}>작성자</th>
                    <th>상세 내용</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr
                        key={item.no}
                        onClick={() => handleRowClick(item)} // 4. 클릭 이벤트 연결
                        style={{ cursor: 'pointer' }}       // 마우스 커서 변경
                      >
                        <td className="text-center text-muted fw-bold">#{item.no}</td>
                        <td className="fw-semibold text-dark">{item.name}</td>
                        <td>
                          <div className="fw-bold text-dark mb-1">{item.title}</div>
                          <div className="text-muted small text-truncate-custom">{item.content}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-5 text-muted">데이터가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 UI */}
            {totalPages > 1 && (
              <ul className="pagination-container">
                <li>
                  <button className="page-btn" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>
                    &lt;
                  </button>
                </li>
                {[...Array(totalPages)].map((_, idx) => (
                  <li key={idx + 1}>
                    <button
                      className={`page-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                      onClick={() => paginate(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  </li>
                ))}
                <li>
                  <button className="page-btn" disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)}>
                    &gt;
                  </button>
                </li>
              </ul>
            )}
          </aside>
        )}
      </div>
      {/* 5. 상세 정보 팝업 (모달) */}
      {selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="m-0">상세 정보 #{selectedItem.no}</h4>
              <button className="btn-close-custom" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="info-group">
                <label>작성자</label>
                <p>{selectedItem.name}</p>
              </div>
              <div className="info-group">
                <label>제목</label>
                <p className="fw-bold">{selectedItem.title}</p>
              </div>
              <div className="info-group">
                <label>내용</label>
                <div className="content-box">{selectedItem.content}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;